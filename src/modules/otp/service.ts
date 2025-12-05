import { Injectable } from '@nestjs/common';
import { OtpRepository } from './repository';
import * as dayjs from 'dayjs';

@Injectable()
export class OtpService {
  constructor(private readonly otpRepository: OtpRepository) {}

  async createOtp(email: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = dayjs().add(5, 'minute').toDate();

    await this.otpRepository.create({
      email,
      otp,
      expiresAt,
    });

    return otp;
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const otpRecord = await this.otpRepository.findOne({
      where: { email, otp },
      order: [['createdAt', 'DESC']],
    });

    if (!otpRecord) {
      return false;
    }

    const now = new Date();
    if (now > otpRecord.expiresAt) {
      return false;
    }

    // Invalidate the OTP after verification
    await this.otpRepository.delete({ where: { id: otpRecord.id } });

    return true;
  }
}
