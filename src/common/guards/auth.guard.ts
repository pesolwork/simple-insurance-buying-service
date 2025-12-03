import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { IJwtConfig } from 'src/config/type';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}
  canActivate(context: ExecutionContext): boolean {
    // ✅ ข้ามการตรวจถ้า endpoint เป็น public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const jwtConfig = this.configService.get<IJwtConfig>('jwt');
    const token = authHeader.split(' ')[1];

    try {
      const payload = jwt.verify(token, jwtConfig.secret);
      request['user'] = payload; // ✅ inject user ไปใน req
      return true;
    } catch (err) {
      console.error('JWT verification error:', err);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
