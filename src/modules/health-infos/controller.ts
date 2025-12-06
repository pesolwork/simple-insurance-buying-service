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
import { HealthInfoService } from './service';
import { HealthInfoDTO } from './dto/dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { UserRole } from 'src/common/enum';
import { HealthInfoSearchDTO } from './dto/search.dto';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { ApiResponseData } from 'src/common/decorators/api-response-data.decorator';
import { HealthInfo } from 'src/models/health-info.model';
import { BaseController } from 'src/common/base/controllers/base.controller';

@Controller({
  version: '1',
  path: 'health-infos',
})
@Roles(UserRole.SuperAdmin, UserRole.Admin)
@UseGuards(AuthGuard, RoleGuard)
export class HealthInfoController extends BaseController<
  HealthInfo,
  HealthInfoDTO
> {
  constructor(private readonly _service: HealthInfoService) {
    super(_service);
  }

  @Post()
  @ApiResponseData(201, HealthInfoDTO)
  create(@Body() body: HealthInfoDTO): Promise<ResponseDTO<HealthInfoDTO>> {
    return this._service.create(body);
  }

  @Put(':id')
  @ApiResponseData(200, HealthInfoDTO)
  update(
    @Param('id') id: number,
    @Body() body: HealthInfoDTO,
  ): Promise<ResponseDTO<HealthInfoDTO>> {
    return this._service.update(id, body);
  }

  @Get(':id')
  @ApiResponseData(200, HealthInfoDTO)
  findById(@Param('id') id: number): Promise<ResponseDTO<HealthInfoDTO>> {
    return this._service.findById(id);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponseData(200, HealthInfoDTO, true)
  findAll(
    @Query() query: HealthInfoSearchDTO,
  ): Promise<ResponseDTO<HealthInfoDTO[]>> {
    return this._service.findAll(query);
  }
}
