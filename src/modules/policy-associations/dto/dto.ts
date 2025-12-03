import { ApiProperty } from '@nestjs/swagger';
import { BeneficiaryDTO } from 'src/modules/beneficiaries/dto/dto';
import { CustomerDTO } from 'src/modules/customers/dto/dto';
import { HealthInfoDTO } from 'src/modules/health-infos/dto/dto';
import { PlanDTO } from 'src/modules/plans/dto/dto';
import { PolicyDTO } from 'src/modules/policies/dto/dto';

export class PolicyAssociationDTO extends PolicyDTO {
  @ApiProperty({ type: () => PlanDTO })
  plan: PlanDTO;

  @ApiProperty({ type: () => HealthInfoDTO })
  healthInfo: HealthInfoDTO;

  @ApiProperty({ type: () => BeneficiaryDTO, isArray: true })
  beneficiaries: BeneficiaryDTO[];

  @ApiProperty({ type: () => CustomerDTO })
  customer: CustomerDTO;
}
