import {
  Controller,
  Get,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './service';
import { UserDTO } from './dto/dto';
import { User } from 'src/models/user.model';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { UserRole } from 'src/common/enum';
import { UserSearchDTO } from './dto/search.dto';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { ApiResponseData } from 'src/common/decorators/api-response-data.decorator';
import { BaseController } from 'src/common/base/controllers/base.controller';

@Controller({
  version: '1',
  path: 'users',
})
@Roles(UserRole.SuperAdmin, UserRole.Admin)
@UseGuards(AuthGuard, RoleGuard)
export class UserController extends BaseController<User, UserDTO> {
  constructor(private readonly _service: UserService) {
    super(_service);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponseData(200, UserDTO, true)
  findAll(@Query() query: UserSearchDTO): Promise<ResponseDTO<UserDTO[]>> {
    return this._service.findAll(query);
  }
}
