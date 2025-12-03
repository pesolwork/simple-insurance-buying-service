import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PolicyRepository } from './repository';
import { PolicyService } from './service';
import { PolicyController } from './controller';
import { Policy } from 'src/models/policy.model';
import { CustomerModule } from '../customers/module';
import { MailerModule } from 'artifacts/mailer/module';
import { PaymentModule } from 'artifacts/payment/module';
import { BeneficiaryModule } from '../beneficiaries/module';
import { HealthInfoModule } from '../health-infos/module';
import { PlanModule } from '../plans/module';
import { RunningNumberModule } from '../running-numbers/module';
import { TransactionModule } from '../transactions/module';
import { PolicyBLL } from './bll';
import { EmailQueueModule } from '../email-queue/module';

@Module({
  imports: [
    SequelizeModule.forFeature([Policy]),
    CustomerModule,
    BeneficiaryModule,
    HealthInfoModule,
    PlanModule,
    PaymentModule,
    MailerModule,
    TransactionModule,
    RunningNumberModule,
    EmailQueueModule,
  ],
  controllers: [PolicyController],
  providers: [PolicyRepository, PolicyService, PolicyBLL],
  exports: [PolicyRepository, PolicyService, PolicyBLL],
})
export class PolicyModule {}
