import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PaymentProcessor } from './processor';
import { PaymentProducer } from './producer';
import { PolicyModule } from '../../policies/module';
import { RunningNumberModule } from 'src/modules/running-numbers/module';
import { TransactionModule } from 'src/modules/transactions/module';
import { EmailQueueModule } from '../email-queue/module';

@Module({
  imports: [
    PolicyModule,
    TransactionModule,
    RunningNumberModule,
    EmailQueueModule,
    BullModule.registerQueue({
      name: 'payment_queue',
    }),
  ],
  providers: [PaymentProcessor, PaymentProducer],
  exports: [PaymentProducer],
})
export class PaymentQueueModule {}
