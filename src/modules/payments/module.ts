import { Module } from '@nestjs/common';
import { PaymentsController } from './controller';
import { PaymentModule } from 'artifacts/payment/module';
import { PaymentsService } from './service';
import { PaymentQueueModule } from '../queues/payment-queue/module';

@Module({
  imports: [PaymentModule, PaymentQueueModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
