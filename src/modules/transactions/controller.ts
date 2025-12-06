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
import { TransactionService } from './service';
import { TransactionDTO } from './dto/dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { UserRole } from 'src/common/enum';
import { TransactionSearchDTO } from './dto/search.dto';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { ApiResponseData } from 'src/common/decorators/api-response-data.decorator';
import { Transaction } from 'src/models/transaction.model';
import { BaseController } from 'src/common/base/controllers/base.controller';

@Controller({
  version: '1',
  path: 'transactions',
})
@Roles(UserRole.SuperAdmin, UserRole.Admin)
@UseGuards(AuthGuard, RoleGuard)
export class TransactionController extends BaseController<
  Transaction,
  TransactionDTO
> {
  constructor(private readonly _service: TransactionService) {
    super(_service);
  }

  @Post()
  @ApiResponseData(201, TransactionDTO)
  create(@Body() body: TransactionDTO): Promise<ResponseDTO<TransactionDTO>> {
    return this._service.create(body);
  }

  @Put(':id')
  @ApiResponseData(200, TransactionDTO)
  update(
    @Param('id') id: number,
    @Body() body: TransactionDTO,
  ): Promise<ResponseDTO<TransactionDTO>> {
    return this._service.update(id, body);
  }

  @Get(':id')
  @ApiResponseData(200, TransactionDTO)
  findById(@Param('id') id: number): Promise<ResponseDTO<TransactionDTO>> {
    return this._service.findById(id);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponseData(200, TransactionDTO, true)
  findAll(
    @Query() query: TransactionSearchDTO,
  ): Promise<ResponseDTO<TransactionDTO[]>> {
    return this._service.findAll(query);
  }
}
