import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { BaseSearchDTO } from 'src/common/base/dto/base-search.dto';
import { PolicyStatus } from 'src/common/enum';

export class PolicySearchDTO extends BaseSearchDTO {
  @ApiProperty({
    required: false,
    type: Number,
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => +value)
  planId?: number;

  @ApiProperty({
    required: false,
    type: Number,
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => +value)
  customerId?: number;

  @ApiProperty({ enum: PolicyStatus, required: false })
  status: PolicyStatus;
}
