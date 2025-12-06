import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
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
import { ApiOperation } from '@nestjs/swagger';
import { ValidateEmailDTO } from './dto/validate-email.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { CreateCustomerDTO } from './dto/create.dto';
import { Request } from 'express';

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

  @Roles(UserRole.Customer)
  @Get('profile')
  @ApiResponseData(200, CustomerDTO)
  getProfile(@Req() req: Request): Promise<ResponseDTO<CustomerDTO>> {
    const body = req['user'];
    return this._service.getProfile(body.userId);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'ลูกค้าใหม่ลงทะเบียน' })
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(200)
  register(@Body() body: CreateCustomerDTO): Promise<ResponseDTO<CustomerDTO>> {
    return this._service.register(body);
  }

  @Public()
  @Post('validate-email')
  @ApiOperation({ summary: 'ตรวจสอบอีเมล' })
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(200)
  validateEmail(@Body() body: ValidateEmailDTO): Promise<ResponseDTO<any>> {
    return this._service.validateEmail(body.email);
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
