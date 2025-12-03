import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CustomerService } from './service';
import { CustomerDTO } from './dto/dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { UserRole } from 'src/common/enum';
import { CustomerSearchDTO } from './dto/search.dto';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { ApiResponseData } from 'src/common/decorators/api-response-data.decorator';
import { Customer } from 'src/models/customer.model';
import { BaseController } from 'src/common/base/controllers/base.controller';

@Controller({
  version: '1',
  path: 'customers',
})
@Roles(UserRole.SuperAdmin)
@UseGuards(AuthGuard, RoleGuard)
export class CustomerController extends BaseController<Customer, CustomerDTO> {
  constructor(private readonly _service: CustomerService) {
    super(_service);
  }

  @Post()
  @ApiResponseData(201, CustomerDTO)
  create(@Body() body: CustomerDTO): Promise<ResponseDTO<CustomerDTO>> {
    return this._service.create(body);
  }

  @Put(':id')
  @ApiResponseData(200, CustomerDTO)
  update(
    @Param('id') id: number,
    @Body() body: CustomerDTO,
  ): Promise<ResponseDTO<CustomerDTO>> {
    return this._service.update(id, body);
  }

  @Get(':id')
  @ApiResponseData(200, CustomerDTO)
  findById(@Param('id') id: number): Promise<ResponseDTO<CustomerDTO>> {
    return this._service.findById(id);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponseData(200, CustomerDTO, true)
  findAll(
    @Query() query: CustomerSearchDTO,
  ): Promise<ResponseDTO<CustomerDTO[]>> {
    return this._service.findAll(query);
  }
}
