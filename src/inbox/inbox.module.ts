import { Module } from '@nestjs/common';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { ChatGateway } from './chat.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InboxController],
  providers: [InboxService, ChatGateway],
  exports: [InboxService, ChatGateway],
})
export class InboxModule {}
