import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from './processor';
import { EmailProducer } from './producer';
import { MailerModule } from 'artifacts/mailer/module';

@Module({
  imports: [
    MailerModule,
    BullModule.registerQueue({
      name: 'email_queue',
    }),
  ],
  providers: [EmailProcessor, EmailProducer],
  exports: [EmailProducer],
})
export class EmailQueueModule {}
