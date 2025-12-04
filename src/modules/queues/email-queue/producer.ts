import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { EmailQueueJobName } from './constants';

@Injectable()
export class EmailProducer {
  constructor(
    @InjectQueue('email_queue')
    private readonly _queue: Queue,
  ) {}

  async sendEmail(data: { to: string; subject: string; html: string }) {
    await this._queue.add(EmailQueueJobName.SendEmail, data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  async sendPolicyEmail(policyId: number) {
    await this._queue.add(
      EmailQueueJobName.SendPolicyEmail,
      { policyId },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
