import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BaseSearchDTO } from 'src/common/base/dto/base-search.dto';
import { ClaimStatus } from 'src/common/enum';

export class ClaimSearchDTO extends BaseSearchDTO {
  @ApiProperty({
    example: 5,
    description: 'Policy ID',
    required: false,
  })
  @Transform(({ value }) => +value)
  policyId: number;

  // ---------- customer_id ----------
  @ApiProperty({ example: 55, required: false })
  @Transform(({ value }) => +value)
  customerId: number;

  // ---------- created_by_id ----------
  @ApiProperty({ example: 3, required: false })
  @Transform(({ value }) => +value)
  createdById: number;

  @ApiProperty({ enum: ClaimStatus, required: false })
  status: ClaimStatus;
}
