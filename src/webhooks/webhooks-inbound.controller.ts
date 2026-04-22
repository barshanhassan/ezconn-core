import { Controller, Post, Body, Param, Logger } from '@nestjs/common';
import { InboxService } from '../inbox/inbox.service';

/**
 * Public Controller for receiving inbound webhooks from external providers
 */
@Controller('webhooks-inbound')
export class WebhooksInboundController {
  private readonly logger = new Logger(WebhooksInboundController.name);

  constructor(private readonly inboxService: InboxService) {}

  @Post(':provider')
  async handleInbound(@Param('provider') provider: string, @Body() body: any) {
    this.logger.log(`Received inbound webhook for provider: ${provider}`);
    
    // In a real scenario, you would verify the signature/source here
    
    return this.inboxService.handleInboundMessage(provider, body);
  }
}
