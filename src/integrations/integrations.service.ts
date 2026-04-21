// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Core Integration Management ───────────────────────────────────

  async getAllIntegrations(workspaceId: bigint) {
    // In Laravel, this was slightly mocked in the snippet, but let's implement the real logic
    const integrations = await this.prisma.integrations.findMany({
      where: { workspace_id: workspaceId },
      // include: { modelable: true } // This is polymorphic, Prisma needs specific includes or manual fetch
    });

    // Manual fetch for modelable because Prisma handles polymorphism through explicit relations
    const enriched = await Promise.all(
      integrations.map(async (integration) => {
        return {
          ...integration,
          modelable: await this.fetchModelable(
            integration.modelable_type,
            integration.modelable_id,
          ),
        };
      }),
    );

    return { integrations: enriched };
  }

  async getIntegrationByType(workspaceId: bigint, type: string) {
    const integration = await this.prisma.integrations.findFirst({
      where: { workspace_id: workspaceId, type: type },
    });
    if (!integration) throw new NotFoundException('Integration not found');

    return {
      ...integration,
      modelable: await this.fetchModelable(
        integration.modelable_type,
        integration.modelable_id,
      ),
    };
  }

  async createIntegration(workspaceId: bigint, data: any) {
    const { type } = data;
    let modelable: any = null;

    switch (type) {
      case 'MICROSOFT':
        modelable = await this.prisma.ms_text_to_speech.create({
          data: {
            key: data.key,
            region: data.region,
          },
        });
        break;
      case 'CLOUDINARY':
        modelable = await this.prisma.cloudinary.create({
          data: {
            cloud_name: data.cloud_name,
            api_key: data.api_key,
            api_secret: data.api_secret,
          },
        });
        break;
      case 'ACTIVECAMPAIGN':
        modelable = await this.prisma.active_campaign_accounts.create({
          data: {
            api_key: data.api_key,
            api_url: data.api_url,
          },
        });
        break;
      case 'CHATGPT':
        // Complex logic with verification and bot updates in Laravel
        modelable = await this.prisma.ai_accounts.create({
          data: {
            workspace_id: workspaceId,
            api_key: data.api_key,
            api_url: 'https://chat.openai.com',
            transcribe: data.transcribe || 'whisper-1',
          },
        });
        // Update existing agents - logic from Laravel
        await this.prisma.ai_agents.updateMany({
          where: { workspace_id: workspaceId, status: 'PAUSED' },
          data: { account_id: modelable.id, status: 'ACTIVE' },
        });
        break;
      case 'ELEVENLABS':
        modelable = await this.prisma.elevenlabs.create({
          data: {
            api_key: data.api_key,
            creator_id: BigInt(1), // Should be current user
          },
        });
        break;
      case 'CAL':
        modelable = await this.prisma.cal_accounts.create({
          data: {
            workspace_id: workspaceId,
            api_key: data.api_key,
          },
        });
        break;
      case 'BASEROW':
        modelable = await this.prisma.baserow_accounts.create({
          data: {
             workspace_id: workspaceId,
             token: data.token,
          },
        });
        break;
      default:
        throw new BadRequestException('Unsupported integration type');
    }

    const integration = await this.linkIntegrationModel(
      workspaceId,
      type,
      modelable,
      data.modelable_type || `App\\Models\\${type}Account`,
    );
    return { integration };
  }

  async updateIntegration(
    workspaceId: bigint,
    integrationId: bigint,
    data: any,
  ) {
    const integration = await this.prisma.integrations.findFirst({
      where: { id: integrationId, workspace_id: workspaceId },
    });
    if (!integration) throw new NotFoundException('Integration not found');

    if (data.action) {
      let status = integration.status;
      if (data.action === 'pause') status = 'PAUSED';
      else if (data.action === 'activate') status = 'ACTIVE';
      else if (data.action === 'suspend') status = 'SUSPENDED';

      await this.prisma.integrations.update({
        where: { id: integrationId },
        data: { status },
      });
    }

    return { success: true };
  }

  async removeIntegration(workspaceId: bigint, integrationId: bigint) {
    const integration = await this.prisma.integrations.findFirst({
      where: { id: integrationId, workspace_id: workspaceId },
    });
    if (!integration) throw new NotFoundException('Integration not found');

    // Logic to delete modelable
    await this.deleteModelable(
      integration.modelable_type,
      integration.modelable_id,
    );
    await this.prisma.integrations.delete({ where: { id: integrationId } });

    return { success: true };
  }

  // ─── Shared Helpers ────────────────────────────────────────────────

  private async fetchModelable(type: string, id: bigint) {
    // Map Laravel classes to Prisma models
    if (type.includes('MSTextToSpeech'))
      return this.prisma.ms_text_to_speech.findUnique({ where: { id } });
    if (type.includes('Cloudinary'))
      return this.prisma.cloudinary.findUnique({ where: { id } });
    if (type.includes('ActiveCampaignAccount'))
      return this.prisma.active_campaign_accounts.findUnique({ where: { id } });
    if (type.includes('AIAccount'))
      return this.prisma.ai_accounts.findUnique({ where: { id } });
    if (type.includes('ElevenLabs'))
      return this.prisma.elevenlabs.findUnique({ where: { id } });
    if (type.includes('CalAccount'))
      return this.prisma.cal_accounts.findUnique({ where: { id } });
    if (type.includes('BaserowAccount'))
      return this.prisma.baserow_accounts.findUnique({ where: { id } });
    return null;
  }

  private async deleteModelable(type: string, id: bigint) {
    if (type.includes('MSTextToSpeech'))
      await this.prisma.ms_text_to_speech.delete({ where: { id } });
    if (type.includes('Cloudinary'))
      await this.prisma.cloudinary.delete({ where: { id } });
    if (type.includes('ActiveCampaignAccount'))
      await this.prisma.active_campaign_accounts.delete({ where: { id } });
    if (type.includes('AIAccount'))
      await this.prisma.ai_accounts.delete({ where: { id } });
    if (type.includes('ElevenLabs'))
      await this.prisma.elevenlabs.delete({ where: { id } });
    if (type.includes('CalAccount'))
      await this.prisma.cal_accounts.delete({ where: { id } });
    if (type.includes('BaserowAccount'))
      await this.prisma.baserow_accounts.delete({ where: { id } });
  }

  private async linkIntegrationModel(
    workspaceId: bigint,
    type: string,
    model: any,
    modelClassName: string,
  ) {
    return this.prisma.integrations.create({
      data: {
        workspace_id: workspaceId,
        type: type,
        modelable_type: modelClassName || 'App\\Models\\Integration', // Fallback
        modelable_id: model.id,
        status: 'ACTIVE',
      },
    });
  }

  // ─── Type Specific Stubs ──────────────────────────────────────────

  async getActiveCampaignData(workspaceId: bigint, accountId: bigint) {
    // Stub: Fetch tags, lists, fields from ActiveCampaign API
    return { tags: [], fields: [], lists: [] };
  }

  async getCloudinaryFolders(workspaceId: bigint) {
    // Stub: Fetch folders from Cloudinary API
    return { folders: [] };
  }

  async getChannels(workspaceId: bigint) {
    // WhatsApp
    const waAccounts = await this.prisma.wa_accounts.findMany({
      where: { workspace_id: workspaceId, status: 'ACTIVE' },
    });
    const whatsapp = await Promise.all(
      waAccounts.map(async (account) => {
        const phone_numbers = await this.prisma.wa_phone_numbers.findMany({
          where: { wa_account_id: account.id },
        });
        return { ...account, phone_numbers };
      }),
    );

    // Instagram (insta_pages)
    const instagram = await this.prisma.insta_pages.findMany({
      where: { workspace_id: workspaceId },
    });

    // Messenger (fb_pages)
    const messenger = await this.prisma.fb_pages.findMany({
      where: { workspace_id: workspaceId },
    });

    // Telegram (telegram_bots)
    const telegram = await this.prisma.telegram_bots.findMany({
      where: { workspace_id: workspaceId },
    });

    // Twilio (twilio_accounts)
    const twilioAccounts = await this.prisma.twilio_accounts.findMany({
      where: { workspace_id: workspaceId },
    });
    const twilio = await Promise.all(
      twilioAccounts.map(async (account) => {
        const numbers = await this.prisma.twilio_numbers.findMany({
          where: { twilio_account_id: account.id },
        });
        return { 
          ...account, 
          sid: account.twilio_account_sid,
          token: account.twilio_auth_token,
          numbers 
        };
      }),
    );

    // Webchat (wc_instances)
    const webchat = await this.prisma.wc_instances.findMany({
      where: { workspace_id: workspaceId },
      select: {
        id: true,
        name: true,
        status: true,
        workspace_id: true,
      },
    });

    return {
      whatsapp,
      instagram,
      messenger,
      telegram,
      twilio,
      webchat,
      evolution: [],
      zapi: [],
    };
  }

  async deleteChannel(workspaceId: bigint, type: string, id: bigint) {
    const where = { id, workspace_id: workspaceId };

    switch (type.toLowerCase()) {
      case 'whatsapp':
        // Note: For WhatsApp, usually it's wa_accounts. Soft delete or hard delete depending on policy.
        return this.prisma.wa_accounts.deleteMany({ where });
      case 'instagram':
        return this.prisma.insta_pages.deleteMany({ where });
      case 'messenger':
        return this.prisma.fb_pages.deleteMany({ where });
      case 'telegram':
        return this.prisma.telegram_bots.deleteMany({ where });
      case 'twilio':
        return this.prisma.twilio_accounts.deleteMany({ where });
      case 'webchat':
        return this.prisma.wc_instances.deleteMany({ where });
      default:
        throw new Error(`Unsupported channel type: ${type}`);
    }
  }

  // ─── API Keys (Personal Access Tokens) ──────────────────────────────

  async getApiKeys(workspaceId: bigint) {
    return this.prisma.personal_access_tokens.findMany({
      where: { 
        tokenable_type: 'Workspace',
        tokenable_id: workspaceId 
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async generateApiKey(workspaceId: bigint, name: string) {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return this.prisma.personal_access_tokens.create({
      data: {
        tokenable_type: 'Workspace',
        tokenable_id: workspaceId,
        name: name || 'API Key',
        token: token,
        abilities: '*',
      }
    });
  }

  async deleteApiKey(tokenId: bigint, workspaceId: bigint) {
    await this.prisma.personal_access_tokens.deleteMany({
      where: { id: tokenId, tokenable_id: workspaceId }
    });
    return { success: true };
  }

  // ─── Visual API Triggers ───────────────────────────────────────────

  async getApiTriggers(workspaceId: bigint) {
    return this.prisma.api_triggers.findMany({
      where: { workspace_id: workspaceId },
      orderBy: { id: 'desc' }
    });
  }

  async createApiTrigger(workspaceId: bigint, data: any) {
    const slug = data.name.toLowerCase().replace(/\s+/g, '-');
    return this.prisma.api_triggers.create({
      data: {
        workspace_id: workspaceId,
        name: data.name,
        slug: slug,
        live: data.live || false,
        update_duplicates: data.update_duplicates || false,
        creator_id: BigInt(1), // Should be current user
      }
    });
  }

  async updateApiTrigger(id: bigint, workspaceId: bigint, data: any) {
    return this.prisma.api_triggers.updateMany({
      where: { id, workspace_id: workspaceId },
      data: {
        name: data.name,
        live: data.live,
        update_duplicates: data.update_duplicates,
        mapping: data.mapping,
        updated_at: new Date(),
      }
    });
  }

  async deleteApiTrigger(id: bigint, workspaceId: bigint) {
    await this.prisma.api_triggers.deleteMany({
      where: { id, workspace_id: workspaceId }
    });
    return { success: true };
  }

  async getApiTriggerLogs(triggerId: bigint, workspaceId: bigint) {
    // Verify trigger belongs to workspace
    const trigger = await this.prisma.api_triggers.findFirst({
      where: { id: triggerId, workspace_id: workspaceId }
    });
    if (!trigger) throw new NotFoundException('Trigger not found');

    return this.prisma.api_trigger_requests.findMany({
      where: { api_trigger_id: triggerId },
      orderBy: { created_at: 'desc' },
      take: 50
    });
  }
}
