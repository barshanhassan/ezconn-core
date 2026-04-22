import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WebhooksController } from './webhooks.controller';
import { WebhooksInboundController } from './webhooks-inbound.controller';
import { WebhooksService } from './webhooks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { InboxModule } from '../inbox/inbox.module';

@Module({
  imports: [PrismaModule, HttpModule, InboxModule],
  controllers: [WebhooksController, WebhooksInboundController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
