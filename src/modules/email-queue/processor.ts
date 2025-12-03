import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailerService } from 'artifacts/mailer/service';
import { PolicyRepository } from '../policies/repository';
import { EmailQueueJobName } from './constants';
import { policyStatusMap } from '../policies/constants';
import { toThaiBath } from 'src/common/utils/numbers';
import { formatThaiDate } from 'src/common/utils/dates';
import * as path from 'path';
import { PolicyAssociationDTO } from '../policy-associations/dto/dto';
import * as PDFDocument from 'pdfkit';
import { PolicyIncludeView, PolicyView } from '../policies/view';

@Processor('email_queue')
export class EmailProcessor extends WorkerHost {
  constructor(
    private readonly _mailerService: MailerService,
    private readonly _policyRepository: PolicyRepository,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    switch (job.name) {
      case EmailQueueJobName.SendEmail:
        return this.sendBasicEmail(job);

      case EmailQueueJobName.SendPolicyEmail:
        return this.sendPolicyEmail(job);

      default:
        throw new Error(`Unknown email job: ${job.name}`);
    }
  }

  private async sendBasicEmail(job: Job<any>) {
    const { to, subject, html } = job.data;

    await this._mailerService.sendMail({ to, subject, html });

    return true;
  }

  private async sendPolicyEmail(job: Job<any>) {
    const { policyId } = job.data;

    const policy = await this._policyRepository.findById(policyId, {
      include: PolicyIncludeView[PolicyView.All],
    });

    if (!policy) {
      throw new Error('Policy not found');
    }

    const policyDTO = policy.toJSON() as PolicyAssociationDTO;
    const pdfBuffer = await this.generatePolicyPdf(policyDTO);

    await this._mailerService.sendMail({
      to: policyDTO?.customer?.email,
      subject: 'ใบเสร็จชำระเบี้ยและกรมธรรม์ (ชำระแล้ว)',
      html: `
      <p>เรียนคุณ ${policyDTO?.customer?.firstName},</p>
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
          filename: `policy-${policyDTO.no}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return true;
  }

  private async generatePolicyPdf(
    policy: PolicyAssociationDTO,
  ): Promise<Buffer> {
    const doc = new PDFDocument();

    // Register Thai Font
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

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`Email job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    console.log(`Email job ${job.id} failed: ${err.message}`);
  }
}
