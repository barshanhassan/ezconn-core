import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChargebeeService } from '../billing/chargebee.service';
import { DomainsService } from '../domains/domains.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AgencyService {
  private readonly logger = new Logger(AgencyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chargebee: ChargebeeService,
    private readonly domainsService: DomainsService,
  ) {}

  // ─── Agency Profile & Branding ──────────────────────────────────────
  
  async getAgency(agencyId: bigint) {
    const agency = await this.prisma.agencies.findUnique({
      where: { id: agencyId },
    });
    if (!agency) throw new NotFoundException('Agency not found');

    const branding = await this.prisma.brandings.findFirst({
      where: { brandable_id: agencyId, brandable_type: 'App\\Models\\Agency' }
    });


    const address = await this.prisma.addresses.findFirst({
      where: {
        addressable_id: agencyId,
        addressable_type: 'App\\Models\\Agency',
      },
    });

    return { 
      success: true, 
      agency: {
        ...this.serialize(agency),
        branding: branding ? this.serialize(branding) : null,
        address: address ? this.serialize(address) : null
      } 
    };

  }


  async updateAgency(agencyId: bigint, data: any) {
    const agency = await this.prisma.agencies.findUnique({
      where: { id: agencyId },
    });
    if (!agency) throw new NotFoundException('Agency not found');

    const address = await this.prisma.addresses.findFirst({
      where: {
        addressable_id: agencyId,
        addressable_type: 'App\\Models\\Agency',
      },
    });

    const updated = await this.prisma.agencies.update({
      where: { id: agencyId },
      data: {
        name: data.name,
        email: data.email,
        notification_email: data.notification_email,
        timezone: data.timezone,
        notification_language: data.notification_language,
        tax_id: data.tax_id,
        vat: data.vat,
        billing_company: data.billing_company,
        billing_person: data.billing_person,
      },
    });

    // Sync with Chargebee
    if (agency.customer_id) {
      const nameArr = (data.billing_person || '').split(' ');
      const firstName = nameArr[0];
      const lastName = nameArr.slice(1).join(' ');

      try {
        await this.chargebee.updateCustomer(agency.customer_id, {
          first_name: firstName,
          last_name: lastName,
          company: data.billing_company,
          email: data.email || agency.email,
          cf_tax_id: data.tax_id,
          cf_vat_number: data.vat,
        });
      } catch (err) {
        this.logger.error(`Chargebee Sync Error: ${err.message}`);
      }
    }

    await this.logAgencyEvent(agencyId, 'agency_updated', data.user_id, 'App\\Models\\Agency', agencyId, data);

    return { success: true, agency: this.serialize(updated) };
  }

  async updateBillingAddress(agencyId: bigint, data: any) {
    const agency = await this.prisma.agencies.findUnique({ where: { id: agencyId } });
    if (!agency) throw new NotFoundException('Agency not found');

    const billingAddress = {
      line1: data.address?.street,
      city: data.address?.city,
      state: data.address?.state,
      zip: data.address?.zip,
      country: data.address?.country_iso2,
    };

    if (agency.customer_id) {
      await this.chargebee.updateCustomerBillingAddress(agency.customer_id, billingAddress);
    }

    // Update local address
    await this.prisma.addresses.upsert({
      where: { id: data.address?.id || 0 }, // Simplified
      update: {
        street: data.address?.street,
        city: data.address?.city,
        state: data.address?.state,
        zip: data.address?.zip,
      },
      create: {
        addressable_id: agencyId,
        addressable_type: 'App\\Models\\Agency',
        street: data.address?.street,
        city: data.address?.city,
        state: data.address?.state,
        zip: data.address?.zip,
      },
    });

    return { success: true };
  }

  async updateBranding(agencyId: bigint, data: any) {
    // 1. Enable/Disable branding on agency
    await this.prisma.agencies.update({
      where: { id: agencyId },
      data: { branding_enabled: data.enabled ?? true },
    });

    // 2. Fetch or create branding record
    let branding = await this.prisma.brandings.findFirst({
      where: { brandable_id: agencyId, brandable_type: 'App\\Models\\Agency' }
    });

    if (!branding) {
      branding = await this.prisma.brandings.create({
        data: {
          brandable_id: agencyId,
          brandable_type: 'App\\Models\\Agency',
          color: '#0a7a22',
        }
      });
    }

    // 3. Update branding details
    const updateData: any = {};
    if (data.mainTheme !== undefined) updateData.color = data.mainTheme;
    if (data.links !== undefined) updateData.link_color = data.links;
    if (data.incomingBubble !== undefined) updateData.incoming_chat_color = data.incomingBubble;
    if (data.incomingText !== undefined) updateData.incoming_chat_text_color = data.incomingText;
    if (data.outgoingBubble !== undefined) updateData.outgoing_chat_color = data.outgoingBubble;
    if (data.outgoingText !== undefined) updateData.outgoing_chat_text_color = data.outgoingText;
    
    // Logo and Favicon IDs
    if (data.logoLightId !== undefined) updateData.mid_logo_light = BigInt(data.logoLightId);
    if (data.logoLightSmallId !== undefined) updateData.mid_logo_light_small = BigInt(data.logoLightSmallId);
    if (data.logoDarkId !== undefined) updateData.mid_logo_dark = BigInt(data.logoDarkId);
    if (data.logoDarkSmallId !== undefined) updateData.mid_logo_dark_small = BigInt(data.logoDarkSmallId);
    if (data.faviconId !== undefined) updateData.favicon_media_id = BigInt(data.faviconId);

    return this.prisma.brandings.update({
      where: { id: branding.id },
      data: updateData,
    });
  }

  // ─── Workspace Management ───────────────────────────────────────────

  async getWorkspaces(agencyId: bigint) {
    const workspaces = await this.prisma.workspaces.findMany({
      where: { agency_id: agencyId, deleted_at: null },
      orderBy: { created_at: 'desc' }
    });
    return { success: true, workspaces: this.serialize(workspaces) };
  }


  async workspaceCheckout(agencyId: bigint, data: any) {
    const agency = await this.prisma.agencies.findUnique({
      where: { id: agencyId },
    });

    if (!agency) throw new NotFoundException('Agency not found');

    const subscription = await this.prisma.billing_subscriptions.findFirst({
      where: { agency_id: agencyId, deleted_at: null },
    });

    if (!subscription || !subscription.billing_plan_id) throw new BadRequestException('Subscription or Plan not found');

    const plan = await this.prisma.billing_plans.findUnique({
      where: { id: subscription.billing_plan_id },
    });

    if (!plan) throw new BadRequestException('Plan not found');

    const totalWorkspaces = await this.prisma.workspaces.count({
      where: { agency_id: agencyId, deleted_at: null },
    });

    if (totalWorkspaces >= plan.maximum_workspaces) {
      throw new BadRequestException('Workspace limit reached');
    }

    // Estimation logic
    const subscriptionItems: any[] = [];
    const extraWorkspaces = totalWorkspaces + 1 - plan.free_workspaces;

    if (extraWorkspaces > 0) {
      // Assuming you have the Price ID for extra workspaces
      subscriptionItems.push({
        item_price_id: process.env.BILLING_WORKSPACE_ADDON_PRICE_ID,
        quantity: extraWorkspaces,
      });
    }

    try {
      const estimate = await this.chargebee.estimateUpdateSubscriptionForItems({
        subscription: { id: subscription.subscription_id },
        subscription_items: subscriptionItems,
      });
      return { success: true, estimate };
    } catch (err) {
      throw new BadRequestException(`Estimation failed: ${err.message}`);
    }
  }

  async createWorkspace(agencyId: bigint, data: any, creatorId: bigint) {
    const agency = await this.prisma.agencies.findUnique({
      where: { id: agencyId },
    });

    if (!agency) throw new NotFoundException('Agency not found');

    const subscription = await this.prisma.billing_subscriptions.findFirst({
      where: { agency_id: agencyId, deleted_at: null },
    });

    const plan = subscription && subscription.billing_plan_id
      ? await this.prisma.billing_plans.findUnique({
          where: { id: subscription.billing_plan_id },
        })
      : null;

    const workspace = await this.prisma.$transaction(async (tx) => {
      // 1. Create Workspace
      const ws = await tx.workspaces.create({
        data: {
          name: data.name,
          slug: data.slug,
          agency_id: agencyId,
          creator_id: creatorId,
          timezone: data.timezone || 'UTC',
          status: 'ACTIVE',
          contacts_counter: 0,
        },
      });

      // 2. Chargebee Sync (if needed)
      if (subscription && plan) {
        const totalWs = await tx.workspaces.count({
          where: { agency_id: agencyId, deleted_at: null },
        });
        const extra = totalWs - plan.free_workspaces;

        if (extra > 0) {
          await this.chargebee.updateSubscriptionForItems(
            subscription.subscription_id,
            {
              subscription_items: [
                {
                  item_price_id: process.env.BILLING_WORKSPACE_ADDON_PRICE_ID,
                  quantity: extra,
                },
              ],
            },
          );
        }
      }

      return ws;
    });

    // 3. Domain creation
    await this.domainsService.addCustomDomain(
      workspace.id,
      'WORKSPACE',
      data.slug,
      process.env.ACCOUNTS_DOMAIN || 'ezconn.io',
      creatorId,
    );

    await this.logAgencyEvent(agencyId, 'workspace_created', creatorId, 'App\\Models\\Workspace', workspace.id, {
      workspace_name: workspace.name,
    });

    return { success: true, workspace: this.serialize(workspace) };
  }

  async updateWorkspace(workspaceId: bigint, agencyId: bigint, data: any) {
    const workspace = await this.prisma.workspaces.findFirst({
      where: { id: workspaceId, agency_id: agencyId },
    });
    if (!workspace)
      throw new NotFoundException('Workspace not found in this agency');

    const updated = await this.prisma.workspaces.update({
      where: { id: workspaceId },
      data: {
        name: data.name,
        allow_branding: data.allow_branding,
        allow_agents: data.allow_agents,
        agents_limit: data.agents_limit,
      },
    });

    return { success: true, workspace: this.serialize(updated) };
  }

  async suspendWorkspace(workspaceId: bigint, agencyId: bigint) {
    return { success: true };
  }

  async activateWorkspace(workspaceId: bigint, agencyId: bigint) {
    return { success: true };
  }

  async deleteWorkspace(workspaceId: bigint, agencyId: bigint) {
    return { success: true };
  }

  async getWorkspaceUsage(workspaceId: bigint, agencyId: bigint) {
    return { success: true };
  }

  // ─── Member Management ──────────────────────────────────────────────

  async members(agencyId: bigint) {
    const users = await this.prisma.users.findMany({
      where: { modelable_id: agencyId, modelable_type: 'App\\Models\\Agency' },
    });
    return { success: true, members: this.serialize(users) };
  }


  async getMember(agencyId: bigint, memberId: bigint) {
    return { success: true, member: null };
  }

  async updateMember(agencyId: bigint, memberId: bigint, data: any) {
    return { success: true };
  }

  async removeMember(agencyId: bigint, memberId: bigint) {
    return { success: true };
  }

  // ─── Logs ──────────────────────────────────────────────────────────

  async getAuditLogs(workspaceId: bigint) {
    return { success: true, logs: [] };
  }

  async getAgencyLogs(agencyId: bigint) {
    return { success: true, logs: [] };
  }

  async addMember(agencyId: bigint, data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.users.create({
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: hashedPassword,
        modelable_id: agencyId,
        modelable_type: 'App\\Models\\Agency',
        status: 'ACTIVE',
        creator_id: 0n, // or actual creator ID if passed, but typically system/admin
      },
    });
    return { success: true, user: this.serialize(user) };
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  private async logAgencyEvent(
    agencyId: bigint,
    event: string,
    userId: bigint,
    modelableType?: string,
    modelableId?: bigint,
    data?: any,
  ) {
    await this.prisma.agency_logs.create({
      data: {
        agency_id: agencyId,
        event: event,
        user_id: userId,
        modelable_type: modelableType,
        modelable_id: modelableId,
        data: data ? JSON.stringify(data) : null,
      },
    });
  }

  private serialize(obj: any) {
    return JSON.parse(
      JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  }
}
