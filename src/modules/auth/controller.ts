import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './service';
import { Public } from 'src/common/decorators/public.decorator';
import {
  LoginDTO,
  LoginOtpDTO,
  LoginResponseDTO,
  RefreshTokenDTO,
  RequestOtpDTO,
} from './dto/dto';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import { Request } from 'express';
import { UserDTO } from '../users/dto/dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { ApiResponseData } from 'src/common/decorators/api-response-data.decorator';

@Controller({
  version: '1',
  path: 'auth',
})
@UseInterceptors(LoggingInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponseData(200, LoginResponseDTO)
  async login(@Body() body: LoginDTO) {
    return this.authService.login(body);
  }

  @Public()
  @Post('otp/request')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  async requestOtp(@Body() body: RequestOtpDTO) {
    return this.authService.requestOtp(body);
  }

  @Public()
  @Post('otp/login')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponseData(200, LoginResponseDTO)
  async loginWithOtp(@Body() body: LoginOtpDTO) {
    return this.authService.loginWithOtp(body);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('me')
  @ApiResponseData(200, UserDTO)
  me(@Req() req: Request) {
    return this.authService.me(req);
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(200)
  @ApiResponseData(200, LoginResponseDTO)
  refreshToken(@Body() body: RefreshTokenDTO) {
    return this.authService.refreshToken(body.refreshToken);
  }
}
