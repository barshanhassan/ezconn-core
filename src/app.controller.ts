import { Controller, Get, Query, Headers } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('ignite')
  async ignite(
    @Query('hostname') queryHostname: string,
    @Headers('origin') origin: string,
    @Headers('host') host: string,
  ) {
    const hostname = queryHostname || origin || host;
    return this.appService.ignite(hostname);
  }
}
