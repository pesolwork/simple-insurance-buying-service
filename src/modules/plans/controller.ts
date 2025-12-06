import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PlanService } from './service';
import { PlanDTO } from './dto/dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { UserRole } from 'src/common/enum';
import { PlanSearchDTO } from './dto/search.dto';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { Plan } from 'src/models/plan.model';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiResponseData } from 'src/common/decorators/api-response-data.decorator';
import { BaseController } from 'src/common/base/controllers/base.controller';
import { ApiOperation } from '@nestjs/swagger';
import { ValidatePlanDTO } from './dto/validate-plan.dto';

@Controller({
  version: '1',
  path: 'plans',
})
@Roles(UserRole.SuperAdmin, UserRole.Admin)
@UseGuards(AuthGuard, RoleGuard)
export class PlanController extends BaseController<Plan, PlanDTO> {
  constructor(private readonly _service: PlanService) {
    super(_service);
  }

  @Public()
  @Post('/validate-age')
  @HttpCode(200)
  @ApiOperation({ summary: 'ตรวจสอบอายุกับแผนประกัน' })
  @UsePipes(new ValidationPipe({ transform: true }))
  validateAge(@Body() body: ValidatePlanDTO) {
    return this._service.validateAge(body);
  }

  @Post()
  @ApiResponseData(201, PlanDTO)
  create(@Body() body: PlanDTO): Promise<ResponseDTO<PlanDTO>> {
    return this._service.create(body);
  }

  @Put(':id')
  @ApiResponseData(200, PlanDTO)
  update(
    @Param('id') id: number,
    @Body() body: PlanDTO,
  ): Promise<ResponseDTO<PlanDTO>> {
    return this._service.update(id, body);
  }

  @Public()
  @ApiOperation({ summary: 'ดึงแผนประกันโดย id' })
  @Get(':id')
  @ApiResponseData(200, PlanDTO)
  findById(@Param('id') id: number): Promise<ResponseDTO<PlanDTO>> {
    return this._service.findById(id);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'ค้นหาแผนประกัน' })
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponseData(200, PlanDTO, true)
  findAll(@Query() query: PlanSearchDTO): Promise<ResponseDTO<PlanDTO[]>> {
    return this._service.findAll(query);
  }
}
