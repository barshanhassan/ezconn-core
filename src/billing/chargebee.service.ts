import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ChargeBeeClient = require('chargebee');

@Injectable()
export class ChargebeeService {
  private readonly logger = new Logger(ChargebeeService.name);
  private client: any;

  constructor(private configService: ConfigService) {
    const site = this.configService.get<string>('CHARGEBEE_SITE') || process.env.CHARGEBEE_SITE;
    const apiKey = this.configService.get<string>('CHARGEBEE_API_KEY') || process.env.CHARGEBEE_API_KEY;

    if (site && apiKey) {
      try {
        this.client = new (ChargeBeeClient as any).Chargebee({ site, api_key: apiKey });
        this.logger.log('Chargebee initialized successfully.');
      } catch (e) {
        this.logger.error('Chargebee init error: ' + e.message);
      }
    } else {
      this.logger.warn('CHARGEBEE_SITE or CHARGEBEE_API_KEY is not defined. Billing features will fail.');
      // Dummy client so the app doesn't crash
      this.client = null;
    }
  }

  // ─── Items ─────────────────────────────────────────────────────────

  async retrieveItem(itemId: string) {
    return this.client.item.retrieve(itemId).request();
  }

  // ─── Customers ─────────────────────────────────────────────────────

  async createCustomer(data: any) {
    return this.client.customer.create(data).request();
  }

  async getCustomer(customerId: string) {
    return this.client.customer.retrieve(customerId).request();
  }

  async updateCustomer(customerId: string, data: any) {
    return this.client.customer.update(customerId, data).request();
  }

  async updateCustomerBillingAddress(customerId: string, billingAddress: any) {
    return this.client.customer
      .update_billing_info(customerId, { billing_address: billingAddress })
      .request();
  }

  // ─── Subscriptions ─────────────────────────────────────────────────

  async getSubscription(subscriptionId: string) {
    return this.client.subscription.retrieve(subscriptionId).request();
  }

  async createSubscriptionForItems(customerId: string, params: any) {
    return this.client.subscription
      .create_with_items(customerId, params)
      .request();
  }

  async updateSubscriptionForItems(subscriptionId: string, params: any) {
    return this.client.subscription
      .update_for_items(subscriptionId, params)
      .request();
  }

  async cancelSubscriptionForItems(subscriptionId: string, params: any = {}) {
    return this.client.subscription
      .cancel_for_items(subscriptionId, params)
      .request();
  }

  // ─── Estimates ─────────────────────────────────────────────────────

  async estimateUpdateSubscriptionForItems(params: any) {
    const result = await this.client.estimate
      .update_subscription_for_items(params)
      .request();
    return result.estimate;
  }

  async estimateUpcomingInvoices(customerId: string) {
    const result = await this.client.estimate
      .upcoming_invoices_estimate(customerId)
      .request();
    return result.estimate;
  }

  // ─── Hosted Pages ──────────────────────────────────────────────────

  async checkoutNewForItems(params: any) {
    const result = await this.client.hostedPage
      .checkout_new_for_items(params)
      .request();
    return result.hosted_page;
  }

  async checkoutExistingForItems(params: any) {
    const result = await this.client.hostedPage
      .checkout_existing_for_items(params)
      .request();
    return result.hosted_page;
  }

  async retrieveHostedPage(hostedPageId: string) {
    const result = await this.client.hostedPage.retrieve(hostedPageId).request();
    return result.hosted_page;
  }
}
