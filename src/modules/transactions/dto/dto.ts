import { ApiProperty } from '@nestjs/swagger';
import { BaseDTO } from 'src/common/base/dto/base.dto';
import { TransactionStatus } from 'src/common/enum';

export class TransactionDTO extends BaseDTO {
  @ApiProperty({ example: 10 })
  policyId: number;

  @ApiProperty({ example: 'TXN-20250101-0001' })
  transactionRef: string;

  @ApiProperty({
    example: '1200.00',
    description: 'Expected amount (DECIMAL)',
  })
  expectedAmount: string;

  @ApiProperty({
    example: '1200.00',
    description: 'Paid amount (DECIMAL)',
  })
  paidAmount: string;

  @ApiProperty({
    example: 'credit_card',
    nullable: true,
  })
  paymentMethod: string | null;

  @ApiProperty({
    example: '2025-01-15T10:30:00.000Z',
    nullable: true,
  })
  paidAt: Date | null;

  @ApiProperty({
    enum: TransactionStatus,
    example: TransactionStatus.Pending,
  })
  status: TransactionStatus;
}
