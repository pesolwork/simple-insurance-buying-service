import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IMailerConfig } from 'src/config/type';

@Injectable()
export class MailerService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const mailConfig = this.configService.get<IMailerConfig>('mailer');
    this.transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: 465,
      secure: true,
      auth: {
        user: mailConfig.user,
        pass: mailConfig.password,
      },
    });
  }

  sendMail(options: nodemailer.SendMailOptions) {
    return this.transporter.sendMail(options);
  }
}
