import { Module } from '@nestjs/common';
import { ConversationEventsController } from './conversation-events.controller';
import { ConversationEventsService } from './conversation-events.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConversationEventsController],
  providers: [ConversationEventsService],
  exports: [ConversationEventsService],
})
export class ConversationEventsModule {}
