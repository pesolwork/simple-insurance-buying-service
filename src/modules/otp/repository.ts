import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseRepository } from 'src/common/base/repositories/base.repository';
import { Otp } from './model';

@Injectable()
export class OtpRepository extends BaseRepository<Otp> {
  constructor(
    @InjectModel(Otp)
    private readonly otpModel: typeof Otp,
  ) {
    super(otpModel);
  }
}
