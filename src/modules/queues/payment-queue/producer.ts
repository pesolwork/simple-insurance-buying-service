import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PaymentQueueJobName } from './enum';

@Injectable()
export class PaymentProducer {
  constructor(
    @InjectQueue('payment_queue')
    private readonly _queue: Queue,
  ) {}

  async processWebhook(data: any) {
    await this._queue.add(PaymentQueueJobName.ProcessWebhook, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
