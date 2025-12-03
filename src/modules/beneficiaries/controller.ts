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
import { BeneficiaryService } from './service';
import { BeneficiaryDTO } from './dto/dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { UserRole } from 'src/common/enum';
import { BeneficiarySearchDTO } from './dto/search.dto';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { ApiResponseData } from 'src/common/decorators/api-response-data.decorator';
import { Beneficiary } from 'src/models/beneficiary.model';
import { BaseController } from 'src/common/base/controllers/base.controller';

@Controller({
  version: '1',
  path: 'beneficiaries',
})
@Roles(UserRole.SuperAdmin)
@UseGuards(AuthGuard, RoleGuard)
export class BeneficiaryController extends BaseController<
  Beneficiary,
  BeneficiaryDTO
> {
  constructor(private readonly _service: BeneficiaryService) {
    super(_service);
  }

  @Post()
  @ApiResponseData(201, BeneficiaryDTO)
  create(@Body() body: BeneficiaryDTO): Promise<ResponseDTO<BeneficiaryDTO>> {
    return this._service.create(body);
  }

  @Put(':id')
  @ApiResponseData(200, BeneficiaryDTO)
  update(
    @Param('id') id: number,
    @Body() body: BeneficiaryDTO,
  ): Promise<ResponseDTO<BeneficiaryDTO>> {
    return this._service.update(id, body);
  }

  @Get(':id')
  @ApiResponseData(200, BeneficiaryDTO)
  findById(@Param('id') id: number): Promise<ResponseDTO<BeneficiaryDTO>> {
    return this._service.findById(id);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponseData(200, BeneficiaryDTO, true)
  findAll(
    @Query() query: BeneficiarySearchDTO,
  ): Promise<ResponseDTO<BeneficiaryDTO[]>> {
    return this._service.findAll(query);
  }
}
