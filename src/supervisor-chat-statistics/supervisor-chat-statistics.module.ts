import { Module } from '@nestjs/common';
import { SupervisorChatStatisticsController } from './supervisor-chat-statistics.controller';
import { SupervisorChatStatisticsService } from './supervisor-chat-statistics.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SupervisorChatStatisticsController],
  providers: [SupervisorChatStatisticsService],
  exports: [SupervisorChatStatisticsService],
})
export class SupervisorChatStatisticsModule {}
