import { ApiProperty } from '@nestjs/swagger';
import { ClaimDTO } from './dto';
import { PolicyDTO } from 'src/modules/policies/dto/dto';
import { CustomerDTO } from 'src/modules/customers/dto/dto';
import { UserDTO } from 'src/modules/users/dto/dto';

export class ClaimAssociationDTO extends ClaimDTO {
  @ApiProperty({ type: () => PolicyDTO })
  policy: PolicyDTO;

  @ApiProperty({ type: () => CustomerDTO })
  customer: CustomerDTO;

  @ApiProperty({ type: () => UserDTO })
  createdBy: UserDTO;
}
