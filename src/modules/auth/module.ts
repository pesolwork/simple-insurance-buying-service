import { Module } from '@nestjs/common';
import { AuthController } from './controller';
import { AuthService } from './service';
import { UserModule } from '../users/module';
import { OtpModule } from '../otp/module';
import { CustomerModule } from '../customers/module';
import { EmailQueueModule } from '../queues/email-queue/module';

@Module({
  imports: [UserModule, OtpModule, CustomerModule, EmailQueueModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
