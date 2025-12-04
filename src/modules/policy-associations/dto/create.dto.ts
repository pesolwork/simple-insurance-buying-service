import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsObject } from 'class-validator';
import { CreateBeneficiaryDTO } from 'src/modules/policies/dto/create-beneficiary.dto';
import { CreateHealthInfoDTO } from 'src/modules/policies/dto/create-health-info.dto';
import { CreatePolicyDTO } from 'src/modules/policies/dto/create.dto';

export class CreatePolicyAssociationDTO extends CreatePolicyDTO {
  @ApiProperty({ type: Number, required: true })
  @IsNumber()
  planId: number;

  @ApiProperty({ type: Number, required: true })
  @IsNumber()
  customerId: number;

  @ApiProperty({ type: () => CreateHealthInfoDTO, required: true })
  @IsObject()
  healthInfo: CreateHealthInfoDTO;

  @ApiProperty({
    type: () => CreateBeneficiaryDTO,
    required: true,
    isArray: true,
  })
  @IsArray()
  beneficiaries: CreateBeneficiaryDTO[];
}
