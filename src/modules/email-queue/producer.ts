import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailProducer {
  constructor(
    @InjectQueue('email_queue')
    private readonly emailQueue: Queue,
  ) {}

  async sendEmail(data: { to: string; subject: string; html: string }) {
    await this.emailQueue.add('send_email', data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
