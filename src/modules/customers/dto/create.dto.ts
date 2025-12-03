import { ApiProperty } from '@nestjs/swagger';
import { BaseDTO } from 'src/common/base/dto/base.dto';

export class CreateCustomerDTO {
  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: '1234567890123' })
  idCardNumber: string;

  @ApiProperty({
    example: '1990-05-20',
    description: 'Date of birth (DATEONLY)',
  })
  dateOfBirth: Date;

  @ApiProperty({ example: '0812345678' })
  phone: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({
    example: '123/45 ถนนพหลโยธิน แขวงจตุจักร กรุงเทพฯ',
  })
  address: string;
}
