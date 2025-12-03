import { ApiProperty } from '@nestjs/swagger';

export class CreateBeneficiaryDTO {
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
