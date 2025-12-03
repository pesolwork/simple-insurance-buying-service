import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { IDatabaseConfig, IQueueConfig } from './config/type';
import configuration from './config/configuration';
import { User } from './models/user.model';
import { UserModule } from './modules/users/module';
import { AuthModule } from './modules/auth/module';
import { Customer } from './models/customer.model';
import { Plan } from './models/plan.model';
import { Policy } from './models/policy.model';
import { HealthInfo } from './models/health-info.model';
import { Beneficiary } from './models/beneficiary.model';
import { PlanModule } from './modules/plans/module';
import { CustomerModule } from './modules/customers/module';
import { PolicyModule } from './modules/policies/module';
import { HealthInfoModule } from './modules/health-infos/module';
import { BeneficiaryModule } from './modules/beneficiaries/module';
import { TransactionModule } from './modules/transactions/module';
import { Transaction } from './models/transaction.model';
import { MailerModule } from 'artifacts/mailer/module';
import { PaymentModule } from 'artifacts/payment/module';
import { RunningNumberModule } from './modules/running-numbers/module';
import { RunningNumber } from './models/running-number.model';
import { PaymentsModule } from './modules/payments/module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Time to live (milliseconds)
        limit: 100, // Maximum number of requests
      },
    ]),
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisConfig = configService.get<IQueueConfig>('queue');
        return {
          connection: {
            host: redisConfig.host,
            port: redisConfig.port,
          },
        };
      },
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const databaseConfig = configService.get<IDatabaseConfig>('database');
        return {
          ...databaseConfig,
          dialect: 'postgres',
          autoLoadModels: false,
          synchronize: false,
          pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
          },
          logging: (sql) => {
            console.debug(sql);
          },
          models: [
            User,
            Customer,
            Plan,
            Policy,
            HealthInfo,
            Beneficiary,
            Transaction,
            RunningNumber,
          ],
        };
      },
    }),
    UserModule,
    AuthModule,
    PlanModule,
    CustomerModule,
    PolicyModule,
    HealthInfoModule,
    BeneficiaryModule,
    TransactionModule,
    MailerModule,
    PaymentModule,
    RunningNumberModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter, // NestJS handles DI here
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    AppService,
  ],
})
export class AppModule {}
