import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOptions, FindOptions } from 'sequelize';
import { PolicyIncludeView, PolicyView } from './view';
import { Sequelize } from 'sequelize-typescript';
import { PolicyService } from './service';
import { PolicyRepository } from './repository';
import { CustomerRepository } from '../customers/repository';
import { BeneficiaryRepository } from '../beneficiaries/repository';
import { HealthInfoRepository } from '../health-infos/repository';
import { Policy } from 'src/models/policy.model';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { PlanRepository } from '../plans/repository';
import { PaymentService } from 'artifacts/payment/service';
import {
  PaymentMethod,
  PolicyStatus,
  TransactionStatus,
  UserRole,
} from 'src/common/enum';
import { TransactionRepository } from '../transactions/repository';
import { HealthInfo } from 'src/models/health-info.model';
import { Beneficiary } from 'src/models/beneficiary.model';
import * as PDFDocument from 'pdfkit';
import { policyStatusMap } from './constants';
import * as path from 'node:path';
import { PolicyAssociationDTO } from '../policy-associations/dto/dto';
import { PolicyAssociationSearchDTO } from '../policy-associations/dto/search.dto';
import { toThaiBath } from 'src/common/utils/numbers';
import { formatThaiDate } from 'src/common/utils/dates';
import { PolicyPaymentQrResponseDTO } from './dto/payment-qr-response.dto';
import { CreatePolicyApplicationDTO } from './dto/create-policy-application.dto';
import { CreateHealthInfoDTO } from './dto/create-health-info.dto';
import { CreateBeneficiaryDTO } from './dto/create-beneficiary.dto';
import { EmailProducer } from '../queues/email-queue/producer';
import { CustomerService } from '../customers/service';
import { CreatePolicyAssociationDTO } from '../policy-associations/dto/create.dto';
import { PlanService } from '../plans/service';
import { Customer } from 'src/models/customer.model';
import { BeneficiaryDTO } from '../beneficiaries/dto/dto';
import { HealthInfoDTO } from '../health-infos/dto/dto';
import { CustomerDTO } from '../customers/dto/dto';

@Injectable()
export class PolicyBLL extends PolicyService {
  constructor(
    private readonly _repo: PolicyRepository,
    private readonly _planRepository: PlanRepository,
    private readonly _customerRepository: CustomerRepository,
    private readonly _beneficiaryRepository: BeneficiaryRepository,
    private readonly _healthInfoRepository: HealthInfoRepository,
    private readonly _transactionRepository: TransactionRepository,
    private readonly _paymentService: PaymentService,
    private readonly _sequelize: Sequelize,
    private readonly _emailProducer: EmailProducer,
    private readonly _customerService: CustomerService,
    private readonly _planService: PlanService,
  ) {
    super(_repo);
  }

  private async loadFullPolicy(policyId: number) {
    return this._repo.findById(policyId, {
      include: [
        { model: this._customerRepository.getModel(), as: 'customer' },
        { model: this._beneficiaryRepository.getModel(), as: 'beneficiaries' },
        { model: this._healthInfoRepository.getModel(), as: 'healthInfo' },
      ],
    });
  }

  async getPolicyPdfStream(policyId: number) {
    const policy = await this.getValidatedPaidPolicy(policyId);
    return this.generatePolicyPdfStream(policy);
  }

  private generatePolicyPdfStream(policy: PolicyAssociationDTO) {
    const doc = new PDFDocument();

    // Register Thai Font
    doc.registerFont('NotoSansThai', path.resolve('fonts', 'NotoSansThai.ttf'));
    doc.font('NotoSansThai');

    // Generate PDF Content
    const { customer, beneficiaries, healthInfo } = policy;

    // Header
    doc.fontSize(20).text('เอกสารกรมธรรม์ประกัน', { underline: true });
    doc.moveDown();

    // Policy summary
    doc.fontSize(14).text(`เลขที่กรมธรรม์: ${policy.no}`);
    doc.text(`ชื่อแผนประกัน: ${policy.name}`);
    doc.text(`รายละเอียดความคุ้มครอง: ${policy.coverageDetails}`);
    doc.text(`สถานะ: ${policyStatusMap[policy.status]}`);
    doc.text(`ทุนประกัน: ${toThaiBath(+policy.sumInsured)}`);
    doc.text(`ค่าเบี้ยประกัน: ${toThaiBath(+policy.premiumAmount)} / ปี`);
    doc.text(`วันที่เริ่มคุ้มครอง: ${formatThaiDate(policy.startDate)}`);
    doc.text(`วันที่สิ้นสุดคุ้มครอง: ${formatThaiDate(policy.endDate)}`);
    doc.moveDown();

    // Customer section
    doc.fontSize(16).text('ข้อมูลผู้เอาประกัน', { underline: true });
    doc.fontSize(14);
    doc.text(`ชื่อ–นามสกุล: ${customer.firstName} ${customer.lastName}`);
    doc.text(`อีเมล: ${customer.email}`);
    doc.text(`เบอร์โทรศัพท์: ${customer.phone ?? '-'}`);
    doc.moveDown();

    // Health info
    doc.fontSize(16).text('ข้อมูลสุขภาพผู้เอาประกัน', { underline: true });
    doc.fontSize(14);
    doc.text(`สูบบุหรี่: ${healthInfo.smoking ? 'ใช่' : 'ไม่'}`);
    doc.text(`ดื่มแอลกอฮอล์: ${healthInfo.drinking ? 'ใช่' : 'ไม่'}`);
    doc.text(`รายละเอียดเพิ่มเติม: ${healthInfo.detail || '-'}`);
    doc.moveDown();

    // Beneficiaries
    doc.fontSize(16).text('ข้อมูลผู้รับผลประโยชน์', { underline: true });
    beneficiaries.forEach((b, index) => {
      doc
        .fontSize(14)
        .text(
          `${index + 1}) ${b.firstName} ${b.lastName} (${b.relationship}) - สัดส่วนรับผลประโยชน์ ${b.percentage}%`,
        );
    });

    doc.end(); // important!

    return doc; // PDFDocument itself is a stream
  }

  async generatePaymentPromptpayQr(id: number) {
    const trx = await this._sequelize.transaction();

    try {
      const policy = await this.getLockedPolicy(id, trx);

      if ([PolicyStatus.Active, PolicyStatus.Expired].includes(policy.status)) {
        throw new BadRequestException('Policy is not in pending state');
      }

      const source = await this.createPaymentSource(policy);
      const charge = await this.createCharge(policy, source);

      const transactionRecord = await this.createTransactionRecord(
        policy,
        charge,
        trx,
      );

      await trx.commit();

      return this.buildQrResponse(
        policy.id,
        transactionRecord.transactionRef,
        charge,
      );
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  private async getLockedPolicy(id: number, trx: any) {
    const policy = await this._repo.findById(id, {
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });

    if (!policy) throw new NotFoundException('Policy not found');
    return policy;
  }

  private createPaymentSource(policy: any) {
    return this._paymentService.createSource({
      amount: policy.premiumAmount * 100,
      currency: 'thb',
      type: PaymentMethod.Promptpay,
    });
  }

  private createCharge(policy: any, source: any) {
    return this._paymentService.createCharge({
      amount: source.amount,
      currency: source.currency,
      source: source.id,
      description: `Payment for Policy #${policy.id}`,
      metadata: {
        policyId: policy.id,
        paymentMethod: source.type,
      },
    });
  }

  private createTransactionRecord(policy: any, charge: any, trx: any) {
    return this._transactionRepository.create(
      {
        policyId: policy.id,
        transactionRef: charge.id,
        expectedAmount: policy.premiumAmount,
        status: TransactionStatus.Pending,
        paymentMethod: charge.source.type,
      },
      { transaction: trx },
    );
  }

  private buildQrResponse(
    policyId: number,
    transactionRef: string,
    charge: any,
  ) {
    const response = new ResponseDTO<PolicyPaymentQrResponseDTO>();

    response.data = {
      policyId,
      transactionRef,
      qrCode: charge?.source?.scannable_code?.image?.download_uri ?? null,
    };

    return response;
  }

  async createPolicyApplication(
    data: CreatePolicyApplicationDTO,
    options?: CreateOptions<any>,
  ): Promise<ResponseDTO<PolicyAssociationDTO>> {
    const result = await this.createPolicyFlow(
      {
        customer: data.customer,
        planId: data.planId,
        healthInfo: data.healthInfo,
        beneficiaries: data.beneficiaries,
        rawData: data,
      },
      options,
    );

    await this.sendApplicationEmail(result, data.planId);

    return new ResponseDTO({ data: result });
  }

  async createPolicyAssociation(
    data: CreatePolicyAssociationDTO,
    user: any,
    options?: CreateOptions<any>,
  ): Promise<ResponseDTO<PolicyAssociationDTO>> {
    if (user.role === UserRole.Customer) {
      const customer = await this._customerRepository.findOne({
        where: {
          userId: user.id,
        },
      });

      if (!customer) throw new BadRequestException('Customer not found');

      data.customerId = customer.id;
    }

    const result = await this.createPolicyFlow(
      {
        customerId: data.customerId,
        planId: data.planId,
        healthInfo: data.healthInfo,
        beneficiaries: data.beneficiaries,
        rawData: data,
      },
      options,
    );

    await this.sendApplicationEmail(result, data.planId);

    return new ResponseDTO({ data: result });
  }

  private async createPolicyFlow(
    payload: {
      customer?: any; // ถ้ามี = สร้างใหม่
      customerId?: number; // ถ้ามี = ใช้ customer เดิม
      planId: number;
      healthInfo: any;
      beneficiaries: any[];
      rawData: any; // original DTO ใช้ในการ preparePayload
    },
    options?: CreateOptions<any>,
  ): Promise<PolicyAssociationDTO> {
    const { customer, customerId, planId, healthInfo, beneficiaries, rawData } =
      payload;

    // --- validate customer ---
    let customerModel: Customer;
    if (customer) {
      await this._customerService.validateEmail(customer.email);
    }

    // get customer (new or existing)
    if (customerId) {
      customerModel = await this._customerRepository.findById(customerId);
      if (!customerModel) throw new NotFoundException('Customer not found');
    }

    // --- get plan ---
    const dob = customer?.dateOfBirth || customerModel.dateOfBirth;
    const plan = await this.getAndValidatePlan(planId, dob);

    // --- validate beneficiaries ---
    this.validateBeneficiaries(beneficiaries);

    // --- prepare policy ---
    const policyPayload = await this.preparePolicyPayload(rawData, plan);

    const trx = await this._sequelize.transaction();
    try {
      options = { ...(options || {}), transaction: trx };

      // --- create customer หากเป็น application ใหม่ ---
      if (customer) {
        customerModel = await this._customerRepository.create(
          customer,
          options,
        );
      }

      policyPayload.customerId = customerModel.id;

      // --- create policy ---
      const policy = await this._repo.create(policyPayload as any, options);

      // --- create associations ---
      const [createdHealthInfo, createdBeneficiaries] =
        await this.createAssociations(
          policy.id,
          healthInfo,
          beneficiaries,
          options,
        );

      await trx.commit();

      return {
        ...new PolicyAssociationDTO(policy),
        customer: new CustomerDTO(customerModel),
        healthInfo: new HealthInfoDTO(createdHealthInfo),
        beneficiaries: createdBeneficiaries.map((x) => new BeneficiaryDTO(x)),
      };
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  private async sendApplicationEmail(
    result: PolicyAssociationDTO,
    planId: number,
  ): Promise<void> {
    const plan = await this.getAndValidatePlan(
      planId,
      result.customer.dateOfBirth,
    );

    this.sendApplicationCreatedEmail(result.customer.email, {
      ...result,
      plan,
    });
  }

  async getAndValidatePlan(planId: number, dob: string | Date) {
    const plan = await this._planRepository.findById(planId);
    if (!plan) throw new BadRequestException('Plan not found');

    if (!this._planService.isAgeInRangeExact(dob, plan.minAge, plan.maxAge)) {
      throw new BadRequestException(
        `Customer age must be between ${plan.minAge} and ${plan.maxAge}`,
      );
    }

    return plan;
  }

  private validateBeneficiaries(beneficiaries: CreateBeneficiaryDTO[]) {
    const total = beneficiaries.reduce((a, b) => a + b.percentage, 0);
    if (total !== 100) {
      throw new BadRequestException(
        'Beneficiaries total percentage must be 100',
      );
    }
  }

  private async preparePolicyPayload(data, plan) {
    return {
      ...data,
      no: null,
      status: PolicyStatus.PendingPayment,
      name: plan.name,
      coverageDetails: plan.coverageDetails,
      sumInsured: plan.sumInsured,
      premiumAmount: plan.premiumAmount,
      startDate: null,
      endDate: null,
    };
  }

  private async createAssociations(
    policyId: number,
    healthInfo: CreateHealthInfoDTO,
    beneficiaries: CreateBeneficiaryDTO[],
    options: CreateOptions<any>,
  ): Promise<[HealthInfo, Beneficiary[]]> {
    const healthPromise = this._healthInfoRepository.create(
      { ...healthInfo, policyId },
      options,
    );

    const beneficiariesPromise = this._beneficiaryRepository.bulkCreate(
      beneficiaries.map((b) => ({ ...b, policyId })),
      options,
    );

    const [createdHealthInfo, createdBeneficiaries] = await Promise.all([
      healthPromise,
      beneficiariesPromise,
    ]);

    return [createdHealthInfo, createdBeneficiaries];
  }

  private async sendApplicationCreatedEmail(to: string, data: any) {
    const { customer, beneficiaries, status } = data;

    await this._emailProducer.sendEmail({
      to,
      subject: 'แจ้งการสร้างใบคำขอประกันสำเร็จ',
      html: `
    <style>
      /* Responsive for mobile */
      @media (max-width: 600px) {
        .btn-payment {
          width: 100% !important;
          padding: 14px 0 !important;
          font-size: 18px !important;
        }
      }

      /* Hover effect */
      .btn-payment:hover {
        background-color: #125ac4 !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 8px rgba(0,0,0,0.25) !important;
      }
    </style>

    <div style="font-family: 'Noto Sans Thai', Arial, sans-serif; line-height:1.6; color:#333;">
      <p>สวัสดีคุณ ${customer.firstName},</p>
      <p>ใบคำขอประกันของคุณถูกสร้างเรียบร้อยแล้ว</p>

      <table style="
        width: 100%;
        border-collapse: collapse;
        font-size: 15px;
        margin-top: 10px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      ">
        <tr>
          <td style="border:1px solid #ddd; padding:10px; width:40%; background:#fafafa;"><b>ชื่อแผนประกัน</b></td>
          <td style="border:1px solid #ddd; padding:10px;">${data.name}</td>
        </tr>
        <tr>
          <td style="border:1px solid #ddd; padding:10px; background:#fafafa;"><b>รายละเอียดความคุ้มครอง</b></td>
          <td style="border:1px solid #ddd; padding:10px;">${data.coverageDetails || 'ไม่ระบุ'}</td>
        </tr>
        <tr>
          <td style="border:1px solid #ddd; padding:10px; background:#fafafa;"><b>ทุนประกัน</b></td>
          <td style="border:1px solid #ddd; padding:10px;">${toThaiBath(+data.sumInsured)}</td>
        </tr>
        <tr>
          <td style="border:1px solid #ddd; padding:10px; background:#fafafa;"><b>ค่าเบี้ยประกัน (ต่อปี)</b></td>
          <td style="border:1px solid #ddd; padding:10px;">${toThaiBath(+data.premiumAmount)} / ปี</td>
        </tr>
        <tr>
          <td style="border:1px solid #ddd; padding:10px; background:#fafafa;"><b>สถานะ</b></td>
          <td style="border:1px solid #ddd; padding:10px;">${policyStatusMap[status]}</td>
        </tr>
        <tr>
          <td style="border:1px solid #ddd; padding:10px; background:#fafafa;"><b>ผู้รับผลประโยชน์</b></td>
          <td style="border:1px solid #ddd; padding:10px;">
            ${beneficiaries
              .map(
                (b) => `
              <div style="margin-bottom:6px;">• ${b.firstName} ${b.lastName} — ${b.relationship}, ${b.percentage}%</div>
            `,
              )
              .join('')}
          </td>
        </tr>
      </table>

      <!-- Payment button -->
      <div style="margin-top: 24px; text-align: center;">
        <a href="https://insurance-buying-system/policies/${data.id}/payment"
          class="btn-payment"
          style="
            display: inline-block;
            background-color: #1a73e8;
            color: #fff;
            width: 260px;
            max-width: 100%;
            padding: 12px 32px;
            border-radius: 10px;
            font-size: 17px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s ease-in-out;
            box-shadow: 0 2px 4px rgba(0,0,0,0.18);
          "
        >
          💳 ชำระเบี้ยประกัน
        </a>
      </div>

      <p style="text-align:center; margin-top:22px; font-size:14px; color:#666;">
        หากคุณยังไม่ดำเนินการชำระ ระบบจะยังไม่เริ่มคุ้มครองตามแผนประกัน
      </p>

      <p style="margin-top:30px;">ขอบคุณที่ใช้บริการ</p>
      <div style="margin-top:5px;"><b>บริษัทประกันภัย</b></div>
    </div>
    `,
    });
  }

  private async getValidatedPaidPolicy(policyId: number) {
    const policy = await this.loadFullPolicy(policyId);

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    if (policy.status === PolicyStatus.PendingPayment) {
      throw new BadRequestException('Policy not paid');
    }

    return policy.toJSON() as PolicyAssociationDTO;
  }

  async findByViewAndId(
    view: PolicyView,
    id: number,
  ): Promise<ResponseDTO<PolicyAssociationDTO>> {
    const options: FindOptions<Policy> = {
      include: PolicyIncludeView[view],
    };
    const result = await this._repo.findById(id, options);

    if (!result) {
      throw new NotFoundException('Data not found');
    }

    const responseDTO = new ResponseDTO<PolicyAssociationDTO>({
      data: result.toJSON() as PolicyAssociationDTO,
    });
    return responseDTO;
  }

  async findAllByView(
    view: PolicyView,
    query?: PolicyAssociationSearchDTO,
    options?: FindOptions<Policy>,
  ): Promise<ResponseDTO<PolicyAssociationDTO[]>> {
    options = options || {};
    options.where = options.where || {};
    options.include = PolicyIncludeView[view];

    return super.findAll(query, options) as any;
  }

  async sendPolicyEmail(id: number) {
    await this.getValidatedPaidPolicy(id);
    this._emailProducer.sendPolicyEmail(id);

    return new ResponseDTO({ message: 'Email sent' });
  }
}
