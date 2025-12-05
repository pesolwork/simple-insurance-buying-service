import { ApiProperty } from '@nestjs/swagger';
import { BaseSearchDTO } from 'src/common/base/dto/base-search.dto';

export class HealthInfoSearchDTO extends BaseSearchDTO {
  @ApiProperty({
    example: 5,
    description: 'Policy ID',
    required: false,
  })
  policyId: number;
}
