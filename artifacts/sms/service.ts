import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ISmsConfig } from 'src/config/type';

@Injectable()
export class SmsService {
  private readonly smsConfig: ISmsConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.smsConfig = this.configService.get<ISmsConfig>('sms');
  }

  async sendSms(tel: string, message: string) {
    const encodedParams = new URLSearchParams();
    encodedParams.set('msisdn', tel);
    encodedParams.set('message', message);
    encodedParams.set('sender', this.smsConfig.sender);

    const observable = this.httpService.post(
      `${this.smsConfig.host}/sms`,
      encodedParams,
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/x-www-form-urlencoded',
          authorization: `Basic ${this.smsConfig.apiKey}`,
        },
      },
    );

    return firstValueFrom(observable);
  }

  async getCredit() {
    const observable = this.httpService.get(`${this.smsConfig.host}/credit`, {
      headers: {
        accept: 'application/json',
        authorization: `Basic ${this.smsConfig.apiKey}`,
      },
    });

    return firstValueFrom(observable);
  }
}
