import { BadRequestException, Injectable } from '@nestjs/common';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { PaymentService } from 'artifacts/payment/service';
import { PaymentProducer } from '../queues/payment-queue/producer';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly _paymentService: PaymentService,
    private readonly _paymentProducer: PaymentProducer,
  ) {}

  private async verifyWebhookCharge(eventId: string, bodyData: any) {
    const event = await this._paymentService.retrieveEvent(eventId);
    const charge = event?.data;

    if (!charge || charge.object !== 'charge' || charge.id !== bodyData.id) {
      throw new BadRequestException('Invalid webhook');
    }

    return charge;
  }

  async paymentWebhook(body: any) {
    const { id: eventId, data } = body;
    const charge = await this.verifyWebhookCharge(eventId, data);
    this._paymentProducer.processWebhook(charge);
    return new ResponseDTO({ message: 'Webhook processed' });
  }
}
