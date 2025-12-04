import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ValidateEmailDTO {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsString()
  email: string;
}
