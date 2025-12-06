import { ApiProperty } from '@nestjs/swagger';
import { BaseSearchDTO } from 'src/common/base/dto/base-search.dto';

export class ClaimSearchDTO extends BaseSearchDTO {
  @ApiProperty({
    example: 5,
    description: 'Policy ID',
    required: false,
  })
  policyId: number;

  // ---------- customer_id ----------
  @ApiProperty({ example: 55, required: false })
  customerId: number;

  // ---------- created_by_id ----------
  @ApiProperty({ example: 3, required: false })
  createdById: number;
}
