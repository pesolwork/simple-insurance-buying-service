import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PolicyService } from './service';
import { PolicyDTO } from './dto/dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { UserRole } from 'src/common/enum';
import { PolicySearchDTO } from './dto/search.dto';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { ApiResponseData } from 'src/common/decorators/api-response-data.decorator';
import { PolicyPaymentQrResponseDTO } from './dto/payment-qr-response.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PolicyBLL } from './bll';
import { PolicyAssociationDTO } from '../policy-associations/dto/dto';
import { Response } from 'express';
import { CreatePolicyApplicationDTO } from './dto/create-policy-application.dto';
import { PolicyView } from './view';
import { PolicyAssociationSearchDTO } from '../policy-associations/dto/search.dto';
import { CreatePolicyAssociationDTO } from '../policy-associations/dto/create.dto';

@Controller({
  version: '1',
  path: 'policies',
})
@ApiBearerAuth()
@Roles(UserRole.SuperAdmin, UserRole.Admin)
@UseGuards(AuthGuard, RoleGuard)
export class PolicyController {
  constructor(
    private readonly _service: PolicyService,
    private readonly _bll: PolicyBLL,
  ) {}

  @Get('/associations/:view')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiParam({ name: 'view', enum: PolicyView })
  @ApiResponseData(200, PolicyAssociationDTO, true)
  async findAllByView(
    @Param('view') view: PolicyView,
    @Query() query?: PolicyAssociationSearchDTO,
  ): Promise<ResponseDTO<PolicyAssociationDTO[]>> {
    return this._bll.findAllByView(view, query);
  }

  @Get('/associations/:view/:id')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiParam({ name: 'view', enum: PolicyView })
  @ApiResponseData(200, PolicyAssociationDTO)
  async findByView(
    @Param('view') view: PolicyView,
    @Param('id') id: number,
  ): Promise<ResponseDTO<PolicyAssociationDTO>> {
    return this._bll.findByViewAndId(view, id);
  }

  @Public()
  @Post('/:id/payments/promptpay')
  @ApiOperation({ summary: 'สร้าง QR Code สําหรับชําระเงิน' })
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponseData(201, PolicyPaymentQrResponseDTO)
  generatePaymentPromptpayQr(@Param('id') id: number) {
    return this._bll.generatePaymentPromptpayQr(id);
  }

  @Public()
  @Get(':id')
  @ApiResponseData(200, PolicyDTO)
  findById(@Param('id') id: number): Promise<ResponseDTO<PolicyDTO>> {
    return this._service.findById(id);
  }

  @Post('/:id/email')
  @ApiOperation({ summary: 'ส่งอีเมลกรมธรรม์' })
  @UsePipes(new ValidationPipe({ transform: true }))
  sendPolicyEmail(@Param('id') id: number) {
    return this._bll.sendPolicyEmail(id);
  }

  @Get('/:id/pdf')
  @ApiOperation({ summary: 'ดาวน์โหลดไฟล์กรมธรรม์ PDF (stream)' })
  async downloadPdf(@Param('id') id: number, @Res() res: Response) {
    const stream = await this._bll.getPolicyPdfStream(id); // ← เปลี่ยนชื่อฟังก์ชันชัดเจน

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="policy.pdf"',
      // 'Content-Disposition': 'inline; filename="policy.pdf"',
    });

    stream.pipe(res);
  }

  @Put(':id')
  @ApiResponseData(200, PolicyDTO)
  update(
    @Param('id') id: number,
    @Body() body: PolicyDTO,
  ): Promise<ResponseDTO<PolicyDTO>> {
    return this._service.update(id, body);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponseData(200, PolicyDTO, true)
  findAll(@Query() query: PolicySearchDTO): Promise<ResponseDTO<PolicyDTO[]>> {
    return this._service.findAll(query);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'สร้างข้อมูลการสมัครประกัน' })
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponseData(201, PolicyAssociationDTO)
  createPolicyApplication(
    @Body() body: CreatePolicyApplicationDTO,
  ): Promise<ResponseDTO<PolicyAssociationDTO>> {
    return this._bll.createPolicyApplication(body);
  }

  @Public()
  @Post('/associations')
  @ApiOperation({ summary: 'สร้างข้อมูลการสมัครประกันแบบมี customer id แล้ว' })
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponseData(201, PolicyAssociationDTO)
  createPolicyAssociation(
    @Body() body: CreatePolicyAssociationDTO,
  ): Promise<ResponseDTO<PolicyAssociationDTO>> {
    return this._bll.createPolicyAssociation(body);
  }
}
