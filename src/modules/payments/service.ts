import { BadRequestException, Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { PolicyService } from '../policies/service';
import { PolicyRepository } from '../policies/repository';
import { CustomerRepository } from '../customers/repository';
import { BeneficiaryRepository } from '../beneficiaries/repository';
import { HealthInfoRepository } from '../health-infos/repository';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { PaymentService } from 'artifacts/payment/service';
import {
  PolicyStatus,
  RunningNumberType,
  TransactionStatus,
} from 'src/common/enum';
import { MailerService } from 'artifacts/mailer/service';
import { TransactionRepository } from '../transactions/repository';
import * as PDFDocument from 'pdfkit';
import { RunningNumberRepository } from '../running-numbers/repository';
import * as path from 'node:path';
import { PolicyAssociationDTO } from '../policy-associations/dto/dto';
import { toThaiBath } from 'src/common/utils/numbers';
import { formatThaiDate } from 'src/common/utils/dates';
import { policyStatusMap } from '../policies/constants';

@Injectable()
export class PaymentsService extends PolicyService {
  constructor(
    private readonly _repo: PolicyRepository,
    private readonly _customerRepository: CustomerRepository,
    private readonly _beneficiaryRepository: BeneficiaryRepository,
    private readonly _healthInfoRepository: HealthInfoRepository,
    private readonly _transactionRepository: TransactionRepository,
    private readonly _runningNumberRepository: RunningNumberRepository,
    private readonly _paymentService: PaymentService,
    private readonly _mailerService: MailerService,
    private readonly _sequelize: Sequelize,
  ) {
    super(_repo);
  }

  private async getRunningNumber() {
    const year = new Date().getFullYear();
    let result = await this._runningNumberRepository.findOne({
      where: {
        type: RunningNumberType.Policy,
        prefix: `POL-${year}`,
      },
    });
    if (!result) {
      result = await this._runningNumberRepository.create({
        type: RunningNumberType.Policy,
        prefix: `POL-${year}`,
        currentNumber: 0,
      });
    }
    return result;
  }

  private async verifyWebhookCharge(eventId: string, bodyData: any) {
    const event = await this._paymentService.retrieveEvent(eventId);
    const charge = event?.data;

    if (!charge || charge.object !== 'charge' || charge.id !== bodyData.id) {
      throw new BadRequestException('Invalid webhook');
    }

    return charge;
  }

  private extractChargeInfo(charge: any) {
    const policyId = charge.metadata?.policyId;
    const paymentMethod = charge.metadata?.paymentMethod;

    if (!policyId || !paymentMethod) {
      throw new BadRequestException('Missing charge metadata');
    }

    const paidAmount = charge.amount / 100;

    return {
      policyId,
      paymentMethod,
      paidAmount,
      isPaid: charge.status === 'successful',
      paidAt: charge.paid_at ? new Date(charge.paid_at) : null,
    };
  }

  private async loadTransaction(transactionRef: string, paymentMethod: string) {
    const trx = await this._transactionRepository.findOne({
      where: { transactionRef, paymentMethod },
    });

    if (!trx) {
      throw new BadRequestException('Transaction not found');
    }

    return trx;
  }

  private async updatePaymentPolicy(
    policyId: number,
    transactionRef: string,
    info: { isPaid: boolean; paidAt: Date | null; paidAmount: number },
  ) {
    const trx = await this._sequelize.transaction();

    try {
      const policy = await this._repo.findById(policyId, {
        transaction: trx,
        lock: trx.LOCK.UPDATE,
      });

      if (!policy) throw new BadRequestException('Policy not found');

      // Already processed (idempotent)
      if (policy.status === PolicyStatus.Active) {
        await trx.commit();
        return;
      }

      const runningNumber = await this.getRunningNumber();
      const finalRunningNumber = runningNumber.currentNumber + 1;

      const policyUpdates = this.buildPolicyUpdate(
        info.isPaid,
        info.paidAt,
        `${runningNumber.prefix}-${finalRunningNumber.toString().padStart(4, '0')}`,
      );

      const transactionUpdates = this.buildTransactionUpdate(
        info.isPaid,
        info.paidAt,
        info.paidAmount,
      );

      await Promise.all([
        this._repo.update(policyUpdates, {
          where: { id: policyId },
          transaction: trx,
        }),
        this._transactionRepository.update(transactionUpdates, {
          where: { transactionRef },
          transaction: trx,
        }),
        info.isPaid &&
          this._runningNumberRepository.update(
            { currentNumber: finalRunningNumber },
            { where: { id: runningNumber.id }, transaction: trx },
          ),
      ]);

      await trx.commit();
    } catch (err) {
      await trx.rollback();
      throw err;
    }
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

  async paymentWebhook(body: any) {
    const { id: eventId, data } = body;

    // Step 1: Verify Webhook Event
    const charge = await this.verifyWebhookCharge(eventId, data);
    const { policyId, paymentMethod, paidAmount, isPaid, paidAt } =
      this.extractChargeInfo(charge);

    // Step 2: Load Transaction
    const transaction = await this.loadTransaction(charge.id, paymentMethod);
    if (paidAmount !== +transaction.expectedAmount) {
      throw new BadRequestException('Invalid amount');
    }

    // Step 3: Update Policy + Transaction inside Transaction Lock
    await this.updatePaymentPolicy(policyId, charge.id, {
      isPaid,
      paidAt,
      paidAmount,
    });

    // Step 4: Send Email After Commit
    if (isPaid) {
      const finalPolicy = await this.loadFullPolicy(policyId);
      await this.sendPolicyPdfEmail(finalPolicy);
    }

    return new ResponseDTO({ message: 'Webhook processed' });
  }

  private async sendPolicyPdfEmail(policy: any) {
    const { customer } = policy;

    // 1) Generate PDF Buffer
    const pdfBuffer = await this.generatePolicyPdf(policy);

    // 2) Send Mail
    await this._mailerService.sendMail({
      to: customer.email,
      subject: 'ใบเสร็จชำระเบี้ยและกรมธรรม์ (ชำระแล้ว)',
      html: `
      <p>เรียนคุณ ${customer.firstName},</p>
      <p>บริษัทได้รับการยืนยันการชำระเบี้ยประกันของท่านเรียบร้อยแล้ว และกรมธรรม์ของท่านได้เริ่มมีผลคุ้มครอง</p>
      <p>กรุณาตรวจสอบเอกสารกรมธรรม์ที่แนบมากับอีเมลฉบับนี้</p>
      <p>หากมีข้อสงสัยเพิ่มเติม ท่านสามารถติดต่อฝ่ายบริการลูกค้าได้ตลอดเวลาค่ะ/ครับ</p>

      <br/>
      <p>ขอขอบคุณที่ไว้วางใจใช้บริการของเรา</p>
      <p><strong>ด้วยความเคารพ</strong></p>
      <p>บริษัทประกันชีวิตของท่าน</p>
    `,
      attachments: [
        {
          filename: 'policy.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  private async generatePolicyPdf(
    policy: PolicyAssociationDTO,
  ): Promise<Buffer> {
    const doc = new PDFDocument();

    doc.registerFont('NotoSansThai', path.resolve('fonts', 'NotoSansThai.ttf'));
    doc.font('NotoSansThai');

    return new Promise((resolve, reject) => {
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const { customer, beneficiaries, healthInfo } = policy;

      // Header
      doc.fontSize(20).text('เอกสารกรมธรรม์ประกัน', { underline: true });
      doc.moveDown();

      // Policy Summary
      doc.fontSize(14).text(`เลขที่กรมธรรม์: ${policy.no}`);
      doc.text(`ชื่อแผนประกัน: ${policy.name}`);
      doc.text(`รายละเอียดความคุ้มครอง: ${policy.coverageDetails}`);
      doc.text(`สถานะ: ${policyStatusMap[policy.status]}`);
      doc.text(`ทุนประกัน: ${toThaiBath(+policy.sumInsured)}`);
      doc.text(`ค่าเบี้ยประกัน: ${toThaiBath(+policy.premiumAmount)} / ปี`);
      doc.text(`วันที่เริ่มคุ้มครอง: ${formatThaiDate(policy.startDate)}`);
      doc.text(`วันที่สิ้นสุดคุ้มครอง: ${formatThaiDate(policy.endDate)}`);
      doc.moveDown();

      // Customer Section
      doc.fontSize(16).text('ข้อมูลผู้เอาประกัน', { underline: true });
      doc.fontSize(14);
      doc.text(`ชื่อ–นามสกุล: ${customer.firstName} ${customer.lastName}`);
      doc.text(`อีเมล: ${customer.email}`);
      doc.text(`เบอร์โทรศัพท์: ${customer.phone ?? '-'}`);
      doc.moveDown();

      // Health Info
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
      doc.moveDown();

      doc.end();
    });
  }

  private buildPolicyUpdate(isPaid: boolean, paidAt: Date | null, no: string) {
    if (!isPaid) {
      return {}; // ไม่แก้ policy หาก payment fail
    }

    const startDate = paidAt;
    const endDate = startDate
      ? new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000)
      : null;

    return {
      no,
      status: PolicyStatus.Active,
      startDate,
      endDate,
    };
  }

  private buildTransactionUpdate(
    isPaid: boolean,
    paidAt: Date | null,
    paidAmount: number,
  ) {
    return {
      status: isPaid ? TransactionStatus.Paid : TransactionStatus.Failed,
      paidAt,
      paidAmount: isPaid ? paidAmount.toString() : null,
    };
  }
}
