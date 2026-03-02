import { Module } from '@nestjs/common';
import { EventLogsController } from './event-logs.controller';
import { EventLogsService } from './event-logs.service';

@Module({
  controllers: [EventLogsController],
  providers: [EventLogsService]
})
export class EventLogsModule {}
