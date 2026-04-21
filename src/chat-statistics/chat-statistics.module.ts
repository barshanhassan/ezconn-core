import { Module } from '@nestjs/common';
import { ChatStatisticsController } from './chat-statistics.controller';
import { ChatStatisticsService } from './chat-statistics.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChatStatisticsController],
  providers: [ChatStatisticsService],
  exports: [ChatStatisticsService],
})
export class ChatStatisticsModule {}
