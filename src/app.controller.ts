import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ResponseDTO } from './common/base/dto/base-response.dto';

@Controller({
  version: '1',
  path: '/app',
})
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return new ResponseDTO({ message: 'OK' });
  }
}
