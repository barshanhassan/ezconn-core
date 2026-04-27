import { PrismaService } from '../../prisma/prisma.service';

export class BillingSyncHelper {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Syncs a Chargebee subscription object to the local database.
   */
  async syncSubscription(agencyId: bigint, subscriptionData: any) {
    const { id, plan_id, status, current_term_start, current_term_end, next_billing_at, customer_id } = subscriptionData;

    // Resolve local plan ID
    const plan = await this.prisma.billing_plans.findFirst({
      where: { item_id: plan_id }
    });

    const existing = await this.prisma.billing_subscriptions.findFirst({
      where: { subscription_id: id }
    });

    const payload = {
      agency_id: agencyId,
      subscription_id: id,
      customer_id: customer_id || '',
      billing_plan_id: plan ? plan.id : null,
      status: status.toUpperCase() as any,
      current_term_start: current_term_start ? new Date(current_term_start * 1000) : null,
      current_term_end: current_term_end ? new Date(current_term_end * 1000) : null,
      next_billing_at: next_billing_at ? new Date(next_billing_at * 1000) : null,
    };

    let billingSubscription;
    if (existing) {
      billingSubscription = await this.prisma.billing_subscriptions.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      billingSubscription = await this.prisma.billing_subscriptions.create({
        data: payload,
      });
    }

    // Sync Subscription Items (Addons)
    if (subscriptionData.subscription_items) {
      // First, remove old items (or update)
      await this.prisma.billing_subscription_items.deleteMany({
        where: { billing_subscription_id: billingSubscription.id },
      });

      for (const item of subscriptionData.subscription_items) {
        await this.prisma.billing_subscription_items.create({
          data: {
            billing_subscription_id: billingSubscription.id,
            item_price_id: item.item_price_id,
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            amount: item.amount || 0,
            item_type: item.item_type || 'ADDON',
          },
        });
      }
    }

    return billingSubscription;
  }
}
