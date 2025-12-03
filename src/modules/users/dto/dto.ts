import { ApiProperty } from '@nestjs/swagger';
import { BaseDTO } from 'src/common/base/dto/base.dto';
import { UserRole } from 'src/common/enum';

export class UserDTO extends BaseDTO {
  @ApiProperty({
    example: 'example@email.com',
    description: 'อีเมลผู้ใช้ (unique)',
  })
  email: string;

  @ApiProperty({
    example: 'hashed_password_here',
    description: 'รหัสผ่านที่ถูกแฮชแล้ว',
  })
  password: string;

  @ApiProperty({
    enum: UserRole,
    description: 'สิทธิ์ของผู้ใช้',
  })
  role: UserRole;
}
