import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { BaseSearchDTO } from 'src/common/base/dto/base-search.dto';

export class PlanSearchDTO extends BaseSearchDTO {
  @ApiProperty({
    required: false,
    type: Number,
    example: 18,
  })
  @IsOptional()
  @Transform(({ value }) => +value)
  age?: number;

  @ApiProperty({
    type: Number,
    required: false,
    example: 500000,
  })
  @IsOptional()
  @Transform(({ value }) => +value)
  minSumInsured?: number;

  @ApiProperty({
    type: Boolean,
    required: false,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;
}
