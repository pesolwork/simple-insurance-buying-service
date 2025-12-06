import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ClaimService } from './service';
import { ClaimDTO } from './dto/dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { UserRole } from 'src/common/enum';
import { ClaimSearchDTO } from './dto/search.dto';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { ApiResponseData } from 'src/common/decorators/api-response-data.decorator';
import { BaseController } from 'src/common/base/controllers/base.controller';
import { Claim } from 'src/models/claim.model';
import { Request } from 'express';
import { ClaimBll } from './bll';
import { ClaimView } from './view';
import { ClaimAssociationDTO } from './dto/association.dto';
import { ApiParam } from '@nestjs/swagger';

@Controller({
  version: '1',
  path: 'claims',
})
@Roles(UserRole.SuperAdmin, UserRole.Admin)
@UseGuards(AuthGuard, RoleGuard)
export class ClaimController extends BaseController<Claim, ClaimDTO> {
  constructor(
    private readonly _service: ClaimService,
    private readonly _bll: ClaimBll,
  ) {
    super(_service);
  }

  @Roles(UserRole.Customer)
  @Get('/associations/:view')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiParam({ name: 'view', enum: ClaimView })
  @ApiResponseData(200, ClaimAssociationDTO, true)
  async findAllByView(
    @Req() req: Request,
    @Param('view') view: ClaimView,
    @Query() query?: ClaimSearchDTO,
  ): Promise<ResponseDTO<ClaimAssociationDTO[]>> {
    if (req['user']?.role === UserRole.Customer) {
      query.customerId = req['user'].customer.id;
    }
    return this._bll.findAllByView(view, query);
  }

  @Roles(UserRole.Customer)
  @Get('/associations/:view/:id')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiParam({ name: 'view', enum: ClaimView })
  @ApiResponseData(200, ClaimAssociationDTO)
  async findByView(
    @Param('view') view: ClaimView,
    @Param('id') id: number,
  ): Promise<ResponseDTO<ClaimAssociationDTO>> {
    return this._bll.findByViewAndId(view, id);
  }

  @Roles(UserRole.Customer)
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponseData(201, ClaimDTO)
  createClaim(
    @Body() body: ClaimDTO,
    @Req() req: Request,
  ): Promise<ResponseDTO<ClaimDTO>> {
    if (
      req['user']?.role === UserRole.Customer &&
      req['user']?.customer?.id !== body.customerId
    ) {
      throw new BadRequestException('Invalid customer');
    }
    return this._service.create(body);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponseData(200, ClaimDTO)
  update(
    @Param('id') id: number,
    @Body() body: ClaimDTO,
  ): Promise<ResponseDTO<ClaimDTO>> {
    return this._service.update(id, body);
  }

  @Roles(UserRole.Customer)
  @Get(':id')
  @ApiResponseData(200, ClaimDTO)
  findById(@Param('id') id: number): Promise<ResponseDTO<ClaimDTO>> {
    return this._service.findById(id);
  }

  @Roles(UserRole.Customer)
  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponseData(200, ClaimDTO, true)
  findAllClaims(
    @Query() query: ClaimSearchDTO,
    @Req() req: Request,
  ): Promise<ResponseDTO<ClaimDTO[]>> {
    if (req['user']?.role === UserRole.Customer) {
      query.customerId = req['user']?.customer?.id;
    }
    return this._service.findAll(query);
  }
}
