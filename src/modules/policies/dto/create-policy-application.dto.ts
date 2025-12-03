import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsObject } from 'class-validator';
import { CreateHealthInfoDTO } from './create-health-info.dto';
import { CreateBeneficiaryDTO } from './create-beneficiary.dto';
import { CreateCustomerDTO } from 'src/modules/customers/dto/create.dto';

export class CreatePolicyApplicationDTO {
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
