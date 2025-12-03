import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber } from 'class-validator';

export class ValidatePlanDTO {
  @ApiProperty({ example: 5, description: 'Plan ID' })
  @IsNumber()
  planId: number;

  @ApiProperty({ example: '1999-01-01', description: 'Date of birth' })
  @IsDateString()
  dateOfBirth: string;
}
