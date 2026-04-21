// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all webhooks for a workspace
   * @param workspaceId
   */
  async list(workspaceId: bigint) {
    const webhooks = await this.prisma.webhooks.findMany({
      where: { workspace_id: workspaceId },
    });
    return { webhooks };
  }

  /**
   * Create a new webhook
   * @param workspaceId
   * @param creatorId
   * @param data
   */
  async create(workspaceId: bigint, creatorId: bigint, data: any) {
    const { name, url, events } = data;

    // URL verification logic from Laravel
    if (!(await this.testWebhook(url))) {
      throw new BadRequestException('We could not verify the webhook URL');
    }

    const webhook = await this.prisma.webhooks.create({
      data: {
        workspace_id: workspaceId,
        name,
        url,
        events: typeof events === 'string' ? events : JSON.stringify(events),
        creator_id: creatorId,
      },
    });

    return { webhook };
  }

  /**
   * Update an existing webhook
   * @param workspaceId
   * @param updaterId
   * @param webhookId
   * @param data
   */
  async update(
    workspaceId: bigint,
    updaterId: bigint,
    webhookId: bigint,
    data: any,
  ) {
    const webhook = await this.prisma.webhooks.findFirst({
      where: { id: webhookId, workspace_id: workspaceId },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    const { name, url, events } = data;

    // URL verification logic
    if (!(await this.testWebhook(url))) {
      throw new BadRequestException('We could not verify the webhook URL');
    }

    const updatedWebhook = await this.prisma.webhooks.update({
      where: { id: webhookId },
      data: {
        name,
        url,
        events: typeof events === 'string' ? events : JSON.stringify(events),
        updater_id: updaterId,
      },
    });

    return { webhook: updatedWebhook };
  }

  /**
   * Delete a webhook
   * @param workspaceId
   * @param webhookId
   */
  async delete(workspaceId: bigint, webhookId: bigint) {
    const webhook = await this.prisma.webhooks.findFirst({
      where: { id: webhookId, workspace_id: workspaceId },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    await this.prisma.webhooks.delete({
      where: { id: webhookId },
    });

    return { success: true };
  }

  /**
   * Test Webhook URL (mirrors Laravel testWebhook method)
   * @param url
   */
  private async testWebhook(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foo: 'bar' }),
      });
      return response.ok;
    } catch (error) {
      this.logger.error(
        `Webhook verification failed for ${url}: ${error.message}`,
      );
      return false;
    }
  }
}
