import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from './processor';
import { EmailProducer } from './producer';
import { MailerModule } from 'artifacts/mailer/module';
import { PolicyModule } from '../../policies/module';
import { PdfModule } from '../../shared/pdf.module';

@Module({
  imports: [
    MailerModule,
    forwardRef(() => PolicyModule),
    BullModule.registerQueue({
      name: 'email_queue',
    }),
    PdfModule,
  ],
  providers: [EmailProcessor, EmailProducer],
  exports: [EmailProducer],
})
export class EmailQueueModule {}
