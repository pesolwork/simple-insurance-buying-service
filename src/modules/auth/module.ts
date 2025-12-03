import { Module } from '@nestjs/common';
import { AuthController } from './controller';
import { AuthService } from './service';
import { SmsModule } from 'artifacts/sms/module';
import { UserModule } from '../users/module';

@Module({
  imports: [UserModule, SmsModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
