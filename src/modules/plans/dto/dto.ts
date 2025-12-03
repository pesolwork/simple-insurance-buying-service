import { ApiProperty } from '@nestjs/swagger';
import { BaseDTO } from 'src/common/base/dto/base.dto';

export class PlanDTO extends BaseDTO {
  @ApiProperty({ example: 'Standard Health Plan' })
  name: string;

  @ApiProperty({
    example: 'Covers hospitalization, surgery, and outpatient care.',
    nullable: true,
  })
  coverageDetails: string | null;

  @ApiProperty({ example: 18 })
  minAge: number;

  @ApiProperty({ example: 60 })
  maxAge: number;

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

  @ApiProperty({ example: true })
  isActive: boolean;
}
