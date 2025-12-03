import { ApiProperty } from '@nestjs/swagger';
import { BaseDTO } from 'src/common/base/dto/base.dto';
import { PolicyStatus } from 'src/common/enum';

export class PolicyDTO extends BaseDTO {
  @ApiProperty({
    example: 3,
    description: 'Plan ID',
  })
  planId: number;

  @ApiProperty({
    example: 10,
    description: 'Customer ID',
  })
  customerId: number;

  @ApiProperty({ example: 'POL-2025-00001' })
  no: string;

  @ApiProperty({ example: 'Standard Health Plan' })
  name: string;

  @ApiProperty({
    example: 'Covers hospitalization, surgery, and outpatient care.',
    nullable: true,
  })
  coverageDetails: string | null;

  @ApiProperty({
    example: '500000.00',
    description: 'Sum insured (DECIMAL stored as string)',
  })
  sumInsured: string;

  @ApiProperty({
    example: '1200.00',
    description: 'Premium amount (DECIMAL stored as string)',
  })
  premiumAmount: string;

  @ApiProperty({
    example: '2025-01-01',
    nullable: true,
  })
  startDate: Date | null;

  @ApiProperty({
    example: '2026-01-01',
    nullable: true,
  })
  endDate: Date | null;

  @ApiProperty({
    enum: PolicyStatus,
    example: PolicyStatus.PendingPayment,
  })
  status: PolicyStatus;
}
