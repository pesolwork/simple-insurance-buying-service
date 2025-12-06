import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailerService } from 'artifacts/mailer/service';
import { PolicyRepository } from '../../policies/repository';
import { EmailQueueJobName } from './enum';
import { PolicyAssociationDTO } from '../../policies/dto/association.dto';
import { PolicyIncludeView, PolicyView } from '../../policies/view';
import { Logger } from '@nestjs/common';
import { PdfService } from '../../shared/pdf.service';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

@Processor('email_queue')
export class EmailProcessor extends WorkerHost {
  private readonly _logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly _mailerService: MailerService,
    private readonly _policyRepository: PolicyRepository,
    private readonly _pdfService: PdfService,
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
    const pdfBuffer = await this._pdfService.generatePolicyPdf(policyDTO);

    await this._mailerService.sendMail({
      to: policyDTO?.customer?.email,
      subject: 'ใบเสร็จชำระเบี้ยและกรมธรรม์ (ชำระแล้ว)',
      html: this.generateHTML(policyDTO),
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

  private generateHTML(data: PolicyAssociationDTO) {
    const templatePath = path.resolve('templates', 'email', 'policy-paid.hbs');
    const templateFile = fs.readFileSync(templatePath, 'utf8');

    const template = handlebars.compile(templateFile);

    return template({
      ...data,
    });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this._logger.log(`Email job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this._logger.log(`Email job ${job.id} failed: ${err.message}`);
  }
}
