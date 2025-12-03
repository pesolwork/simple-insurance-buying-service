import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as omise from 'omise';
import { IPaymentConfig } from 'src/config/type';

@Injectable()
export class PaymentService {
  private readonly omiseInstance: omise.IOmise;

  constructor(private readonly configService: ConfigService) {
    const paymentConfig = this.configService.get<IPaymentConfig>('payment');
    this.omiseInstance = omise({
      ...paymentConfig,
    });
  }

  createCharge(req: omise.Charges.IRequest) {
    return this.omiseInstance.charges.create(req);
  }

  createSource(req: omise.Sources.IRequest) {
    return this.omiseInstance.sources.create(req);
  }

  retrieveCharge(id: string) {
    return this.omiseInstance.charges.retrieve(id);
  }

  retrieveEvent(eventId: string) {
    return this.omiseInstance.events.retrieve(eventId);
  }
}
