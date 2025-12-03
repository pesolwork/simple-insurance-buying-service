import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { UserDTO } from '../../users/dto/dto';

export class LoginDTO {
  @ApiProperty({
    example: 'user@example.com',
    description: 'อีเมลผู้ใช้งาน (unique)',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password of the user',
    required: true,
    type: String,
    example: 'password123',
  })
  @IsString()
  password: string;
}

export class RefreshTokenDTO {
  @ApiProperty({
    description: 'Refresh token',
    required: true,
    type: String,
    example: 'refresh_token',
  })
  @IsString()
  refreshToken: string;
}

export class LoginResponseDTO {
  @ApiProperty({
    description: 'Access token',
    type: String,
    example: 'access_token',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token',
    type: String,
    example: 'refresh_token',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'User information',
    type: UserDTO,
  })
  user: UserDTO;
}
