import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { LoginDTO, LoginOtpDTO, RequestOtpDTO } from './dto/dto';
import { ConfigService } from '@nestjs/config';
import { IJwtConfig } from 'src/config/type';
import { Request } from 'express';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { UserRepository } from '../users/repository';
import { OtpService } from '../otp/service';
import { EmailProducer } from '../queues/email-queue/producer';
import { Customer } from 'src/models/customer.model';
import { User } from 'src/models/user.model';

@Injectable()
export class AuthService {
  private readonly jwtConfig: IJwtConfig;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly otpService: OtpService,
    private readonly emailProducer: EmailProducer,
    private readonly configService: ConfigService,
  ) {
    this.jwtConfig = this.configService.get<IJwtConfig>('jwt');
  }

  generateToken(user: any) {
    const { secret, refreshSecret } = this.jwtConfig;
    const payload = {
      sub: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      customer: user?.customer,
    };
    const accessToken = jwt.sign(payload, secret, {
      expiresIn: '1h',
    });
    const refreshToken = jwt.sign({ userId: payload.userId }, refreshSecret, {
      expiresIn: '1d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private createLoginResponse(user: User) {
    const tokens = this.generateToken(user);
    const userJson = user.toJSON();
    delete userJson.password;

    const responseDTO = new ResponseDTO();
    responseDTO.data = {
      ...tokens,
      user: userJson,
    };
    return responseDTO;
  }

  async refreshToken(token: string) {
    try {
      const { refreshSecret } = this.jwtConfig;
      const decoded: any = jwt.verify(token, refreshSecret);
      const userId = decoded.userId;
      const user = await this.userRepository.findById(userId, {
        attributes: {
          exclude: ['password'],
        },
        include: [Customer],
      });
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.createLoginResponse(user);
    } catch (_) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async me(req: Request) {
    const data = req['user'];

    if (!data || !data.userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const result = await this.userRepository.findById(data.userId, {
      attributes: {
        exclude: ['password'],
      },
      include: [Customer],
    });
    if (!result) {
      throw new BadRequestException('User not found');
    }

    const responseDTO = new ResponseDTO();
    responseDTO.data = {
      ...result.toJSON(),
    };
    return responseDTO;
  }

  async login(body: LoginDTO) {
    const user = await this.userRepository.findOne({
      where: { email: body.email },
      include: [Customer],
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createLoginResponse(user);
  }

  async requestOtp(body: RequestOtpDTO) {
    const user = await this.userRepository.findOne({
      where: { email: body.email },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const otp = await this.otpService.createOtp(body.email);
    this.emailProducer.sendEmail({
      to: user.email,
      subject: 'รหัส OTP สำหรับบริการซื้อประกันอย่างง่าย',
      html: `
        <p>สวัสดีครับ/ค่ะ,</p>
        <p>รหัส OTP สำหรับยืนยันตัวตนของคุณคือ: <b>${otp}</b></p>
        <p>รหัสนี้จะมีอายุ 5 นาที กรุณาไม่นำไปเปิดเผยให้ผู้อื่นทราบ</p>
        <p>หากคุณไม่ได้เป็นผู้ขอรหัสนี้ กรุณาติดต่อฝ่ายสนับสนุนทันที</p>
        <br/>
        <p>ขอบคุณครับ/ค่ะ,<br/>ทีมงาน Simple Insurance</p>
      `,
    });

    const responseDTO = new ResponseDTO();
    responseDTO.data = { message: 'OTP sent successfully' };
    return responseDTO;
  }

  async loginWithOtp(body: LoginOtpDTO) {
    const isValid = await this.otpService.verifyOtp(body.email, body.otp);
    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    const user = await this.userRepository.findOne({
      where: { email: body.email },
      include: [Customer],
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.createLoginResponse(user);
  }
}
