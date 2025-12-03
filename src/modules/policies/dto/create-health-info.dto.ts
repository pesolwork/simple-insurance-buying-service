import { ApiProperty } from '@nestjs/swagger';

export class CreateHealthInfoDTO {
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
