import { UserRepository } from '../users/repository';
import { User } from 'src/models/user.model';
import { PdfService } from '../shared/pdf.service';
import { ConfigService } from '@nestjs/config';
import { IAppConfig } from 'src/config/type';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentService } from 'artifacts/payment/service';
import { CreateOptions, Transaction, FindOptions } from 'sequelize';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import {
  PolicyStatus,
  PaymentMethod,
  TransactionStatus,
  UserRole,
} from 'src/common/enum';
import { toThaiBath } from 'src/common/utils/numbers';
import { Beneficiary } from 'src/models/beneficiary.model';
import { Customer } from 'src/models/customer.model';
import { HealthInfo } from 'src/models/health-info.model';
import { Policy } from 'src/models/policy.model';
import { BeneficiaryDTO } from '../beneficiaries/dto/dto';
import { BeneficiaryRepository } from '../beneficiaries/repository';
import { CustomerDTO } from '../customers/dto/dto';
import { CustomerRepository } from '../customers/repository';
import { CustomerService } from '../customers/service';
import { HealthInfoDTO } from '../health-infos/dto/dto';
import { HealthInfoRepository } from '../health-infos/repository';
import { PlanRepository } from '../plans/repository';
import { PlanService } from '../plans/service';
import { PolicyAssociationDTO } from './dto/association.dto';
import { CreatePolicyAssociationDTO } from './dto/create-association.dto';
import { PolicyAssociationSearchDTO } from './dto/search-association.dto';
import { EmailProducer } from '../queues/email-queue/producer';
import { TransactionRepository } from '../transactions/repository';
import { policyStatusMap } from './constants';
import { CreateBeneficiaryDTO } from './dto/create-beneficiary.dto';
import { CreateHealthInfoDTO } from './dto/create-health-info.dto';
import { CreatePolicyApplicationDTO } from './dto/create-policy-application.dto';
import { PolicyPaymentQrResponseDTO } from './dto/payment-qr-response.dto';
import { PolicyRepository } from './repository';
import { PolicyService } from './service';
import { PolicyView, PolicyIncludeView } from './view';
import * as bcrypt from 'bcrypt';
import { Sequelize } from 'sequelize-typescript';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

@Injectable()
export class PolicyBLL extends PolicyService {
  private readonly appConfig: IAppConfig;
  private readonly applicationTemplate: handlebars.TemplateDelegate;

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
    private readonly _userRepository: UserRepository,
    private readonly _pdfService: PdfService,
    private readonly configService: ConfigService,
  ) {
    super(_repo);
    this.appConfig = this.configService.get<IAppConfig>('app');
    this.applicationTemplate = this.compileApplicationTemplate();
  }

  private compileApplicationTemplate(): handlebars.TemplateDelegate {
    const templatePath = path.resolve(
      'templates',
      'email',
      'policy-application.hbs',
    );
    const templateFile = fs.readFileSync(templatePath, 'utf8');

    // Register helpers
    handlebars.registerHelper('toThaiBath', (amount) => toThaiBath(amount));
    handlebars.registerHelper(
      'policyStatusText',
      (status) => policyStatusMap[status],
    );

    return handlebars.compile(templateFile);
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
    return this._pdfService.generatePolicyPdfStream(policy);
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
      const customer = await this._customerRepository.findById(
        user?.customer?.id,
      );

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

      let userModel: User;
      if (rawData.isRegister) {
        userModel = await this.createUser(
          {
            email: customer.email,
            password: customer?.password,
          },
          trx,
        );
      }

      // --- create customer หากเป็น application ใหม่ ---
      if (customer) {
        customer.userId = userModel?.id || null;
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

  private async createUser(
    body: { email: string; password: string },
    transaction: Transaction,
  ) {
    const hashedPassword = await bcrypt.hash(body.password, 10);
    return this._userRepository.create(
      {
        email: body.email,
        password: hashedPassword,
        role: UserRole.Customer,
      },
      { transaction },
    );
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
    const html = this.applicationTemplate({
      ...data,
      paymentUrl: `${this.appConfig.frontendUrl}/policies/${data.id}/payment`,
    });

    await this._emailProducer.sendEmail({
      to,
      subject: 'แจ้งการสร้างใบคำขอสำเร็จ',
      html,
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
