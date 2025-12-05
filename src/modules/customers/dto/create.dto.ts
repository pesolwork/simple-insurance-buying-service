import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCustomerDTO {
  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: '1234567890123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(13)
  @MaxLength(13)
  idCardNumber: string;

  @ApiProperty({
    example: '1990-05-20',
    description: 'Date of birth (YYYY-MM-DD)',
  })
  @IsNotEmpty()
  @IsDateString()
  dateOfBirth: Date;

  @ApiProperty({ example: '0812345678' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: '123/45 ถนนพหลโยธิน แขวงจตุจักร กรุงเทพฯ',
    required: false,
  })
  @IsOptional()
  @IsString()
  address: string;
}
