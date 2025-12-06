import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BaseSearchDTO } from 'src/common/base/dto/base-search.dto';

export class TransactionSearchDTO extends BaseSearchDTO {
  @ApiProperty({
    example: 5,
    description: 'Policy ID',
    required: false,
  })
  @Transform(({ value }) => +value)
  policyId: number;
}
