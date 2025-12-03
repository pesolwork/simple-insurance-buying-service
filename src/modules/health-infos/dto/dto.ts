import { ApiProperty } from '@nestjs/swagger';
import { BaseDTO } from 'src/common/base/dto/base.dto';

export class HealthInfoDTO extends BaseDTO {
  @ApiProperty({
    example: 5,
    description: 'Policy ID',
  })
  policyId: number;

  @ApiProperty({
    example: true,
    description: 'Is the customer smoking?',
  })
  smoking: boolean;

  @ApiProperty({
    example: false,
    description: 'Does the customer drink alcohol?',
  })
  drinking: boolean;

  @ApiProperty({
    example: 'Has mild allergy to seafood.',
    nullable: true,
  })
  detail: string | null;
}
