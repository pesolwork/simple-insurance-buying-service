import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailerService } from 'artifacts/mailer/service';

@Processor('email_queue')
export class EmailProcessor extends WorkerHost {
  constructor(private readonly mailer: MailerService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { to, subject, html } = job.data;

    await this.mailer.sendMail({ to, subject, html });

    return { status: 'sent' };
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
