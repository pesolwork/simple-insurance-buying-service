import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { PaymentsService } from './service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly _service: PaymentsService) {}

  @Public()
  @Post('/webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'รับ Webhook Payment Provider' })
  paymentWebhook(@Body() body: any) {
    return this._service.paymentWebhook(body);
  }
}
