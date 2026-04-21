import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { EventLogsService } from './event-logs.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('event-logs')
export class EventLogsController {
  constructor(private readonly eventLogsService: EventLogsService) {}

  @Get('get')
  getLogs(@Request() req: any) {
    return { message: 'Fetching event logs', user: req.user };
  }
}
