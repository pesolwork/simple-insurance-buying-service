import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Otp } from './model';
import { OtpRepository } from './repository';
import { OtpService } from './service';

@Module({
  imports: [SequelizeModule.forFeature([Otp])],
  providers: [OtpRepository, OtpService],
  exports: [OtpService, OtpRepository],
})
export class OtpModule {}
