import { Module } from '@nestjs/common';
import { PaymentsController } from './controller';
import { PolicyModule } from '../policies/module';
import { MailerModule } from 'artifacts/mailer/module';
import { PaymentModule } from 'artifacts/payment/module';
import { BeneficiaryModule } from '../beneficiaries/module';
import { CustomerModule } from '../customers/module';
import { HealthInfoModule } from '../health-infos/module';
import { RunningNumberModule } from '../running-numbers/module';
import { TransactionModule } from '../transactions/module';
import { PaymentsService } from './service';

@Module({
  imports: [
    PolicyModule,
    CustomerModule,
    BeneficiaryModule,
    HealthInfoModule,
    PaymentModule,
    MailerModule,
    TransactionModule,
    RunningNumberModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
