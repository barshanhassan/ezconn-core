// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Webhook Handling ───────────────────────────────────────────────

  async handleBillingEvents(payload: any) {
    this.logger.debug(`Billing Event: ${payload.event_type}`);
    // Stub: Process Chargebee events (subscription_created, etc.)
    // In the original code, this dispatches a ProcessBillingEvent job
    return { success: true };
  }

  // ─── Subscription Lifecycle ──────────────────────────────────────────

  async upgrade(workspaceId: bigint, itemPriceId: string) {
    // Fetch current subscription
    const subscription = await this.prisma.billing_subscriptions.findFirst({
      where: { workspace_id: workspaceId },
    });

    // Stub: Initiate Chargebee checkout/upgrade
    return {
      message: `Upgrade initiated for price: ${itemPriceId}`,
      // hosted_page: { url: '...' }
    };
  }

  async cancelSubscription(workspaceId: bigint) {
    await this.prisma.billing_subscriptions.updateMany({
      where: { workspace_id: workspaceId, status: 'ACTIVE' },
      data: { status: 'CANCELLED' as any, cancelled_at: new Date() },
    });
    return { success: true };
  }

  async resubscribe(workspaceId: bigint) {
    // Logic to reactivate a cancelled subscription
    await this.prisma.billing_subscriptions.updateMany({
      where: { workspace_id: workspaceId, status: 'CANCELLED' },
      data: { status: 'ACTIVE' as any, cancelled_at: null },
    });
    return { success: true };
  }

  async acknowledge(workspaceId: bigint, hostedPageId: string) {
    // Callback after hosted page checkout
    this.logger.debug(
      `Acknowledging hosted page ${hostedPageId} for workspace ${workspaceId}`,
    );
    // Stub: Sync subscription data from Chargebee
    return { success: true };
  }

  // ─── Usage & Dashboard ──────────────────────────────────────────────

  async getCurrentUsage(workspaceId: bigint) {
    const usage = await this.prisma.workspace_usages.findFirst({
      where: { workspace_id: workspaceId },
    });

    // Detailed usage breakdown (contacts, messages, AI, etc.)
    return {
      usage,
      limits: {
        contacts: 1000,
        messages: 5000,
        ai_queries: 100,
      },
    };
  }

  // ─── Account Settings ───────────────────────────────────────────────

  async saveInvoiceRecipient(workspaceId: bigint, data: any) {
    // In original code, this updates billing info in Chargebee
    return { success: true };
  }

  async deleteInvoiceRecipient(workspaceId: bigint, contactId: string) {
    // Logic to remove a billing contact
    return { success: true };
  }

  async applyACoupon(workspaceId: bigint, couponCode: string) {
    // Validate and apply coupon in Chargebee
    return { success: true };
  }

  // ─── VIP Pass & Agency Branding ──────────────────────────────────────

  async checkoutVipPass(workspaceId: bigint) {
    // Checkout flow for VIP passes
    return { url: 'https://checkout.example.com/vip-pass' };
  }

  async acknowledgeVipPass(workspaceId: bigint, hostedPageId: string) {
    return { success: true };
  }

  async cancelVipPass(workspaceId: bigint) {
    return { success: true };
  }

  async agencyBranding(workspaceId: bigint) {
    // Checkout flow for agency branding add-on
    return { url: 'https://checkout.example.com/branding' };
  }
}
