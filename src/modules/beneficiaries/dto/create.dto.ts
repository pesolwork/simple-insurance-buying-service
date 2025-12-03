import { ApiProperty } from '@nestjs/swagger';

export class CreateBeneficiaryDTO {
  @ApiProperty({
    example: 5,
    description: 'Policy ID',
  })
  policyId: number;

  @ApiProperty({ example: 'Somchai' })
  firstName: string;

  @ApiProperty({ example: 'Sudsakul' })
  lastName: string;

  @ApiProperty({
    example: 'Father',
    description: 'Relationship to the customer',
  })
  relationship: string;

  @ApiProperty({
    example: 50,
    description: 'Percentage share of the benefit',
  })
  percentage: number;
}
