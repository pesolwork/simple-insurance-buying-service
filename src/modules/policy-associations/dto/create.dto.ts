import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsObject } from 'class-validator';
import { CreateBeneficiaryDTO } from 'src/modules/beneficiaries/dto/create.dto';
import { CreateCustomerDTO } from 'src/modules/customers/dto/create.dto';
import { CreateHealthInfoDTO } from 'src/modules/health-infos/dto/create.dto';
import { CreatePolicyDTO } from 'src/modules/policies/dto/create.dto';

export class CreatePolicyAssociationDTO extends CreatePolicyDTO {
  @ApiProperty({ type: Number, required: true })
  @IsNumber()
  planId: number;

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

  @ApiProperty({ type: () => CreateCustomerDTO, required: true })
  @IsObject()
  customer: CreateCustomerDTO;
}
