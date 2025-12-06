import {
  Body,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Model } from 'sequelize-typescript';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enum';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import { ResponseDTO } from '../dto/base-response.dto';
import { BaseSearchDTO } from '../dto/base-search.dto';
import { BaseService } from '../services/base.service';

@UseInterceptors(LoggingInterceptor)
@ApiBearerAuth()
@UseGuards(AuthGuard, RoleGuard)
@Roles(UserRole.SuperAdmin)
export abstract class BaseController<T extends Model, R> {
  constructor(protected readonly service: BaseService<T, R>) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() query: BaseSearchDTO): Promise<ResponseDTO<R[]>> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async findById(@Param('id') id: number): Promise<ResponseDTO<R>> {
    return this.service.findById(id);
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() body: any): Promise<ResponseDTO<R>> {
    return this.service.create(body);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id') id: number,
    @Body() body: any,
  ): Promise<ResponseDTO<R>> {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async delete(@Param('id') id: number): Promise<ResponseDTO<number>> {
    return this.service.delete(id);
  }
}
