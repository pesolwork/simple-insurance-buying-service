import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { LoginDTO } from './dto/dto';
import { ConfigService } from '@nestjs/config';
import { IJwtConfig } from 'src/config/type';
import { Request } from 'express';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { UserRepository } from '../users/repository';

@Injectable()
export class AuthService {
  private readonly jwtConfig: IJwtConfig;

  constructor(
    private readonly userRepository: UserRepository,
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

  async refreshToken(token: string) {
    try {
      const { refreshSecret } = this.jwtConfig;
      const decoded: any = jwt.verify(token, refreshSecret);
      const userId = decoded.userId;
      const user = await this.userRepository.findById(userId, {
        attributes: {
          exclude: ['password'],
        },
      });
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const result = this.generateToken(user);
      const responseDTO = new ResponseDTO();
      responseDTO.data = { ...result, user };
      return responseDTO;
    } catch (error) {
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
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const result = this.generateToken(user);

    const responseDTO = new ResponseDTO();
    responseDTO.data = {
      ...result,
      user: {
        ...user.toJSON(),
        password: undefined,
      },
    };

    return responseDTO;
  }
}
