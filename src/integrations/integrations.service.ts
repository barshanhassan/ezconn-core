// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntegrationsService {
    private readonly logger = new Logger(IntegrationsService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ─── Core Integration Management ───────────────────────────────────

    async getAllIntegrations(workspaceId: bigint) {
        // In Laravel, this was slightly mocked in the snippet, but let's implement the real logic
        const integrations = await this.prisma.integrations.findMany({
            where: { workspace_id: workspaceId },
            // include: { modelable: true } // This is polymorphic, Prisma needs specific includes or manual fetch
        });

        // Manual fetch for modelable because Prisma handles polymorphism through explicit relations
        const enriched = await Promise.all(integrations.map(async (integration) => {
            return {
                ...integration,
                modelable: await this.fetchModelable(integration.modelable_type, integration.modelable_id)
            };
        }));

        return { integrations: enriched };
    }

    async getIntegrationByType(workspaceId: bigint, type: string) {
        const integration = await this.prisma.integrations.findFirst({
            where: { workspace_id: workspaceId, type: type }
        });
        if (!integration) throw new NotFoundException('Integration not found');

        return {
            ...integration,
            modelable: await this.fetchModelable(integration.modelable_type, integration.modelable_id)
        };
    }

    async createIntegration(workspaceId: bigint, data: any) {
        const { type } = data;
        let modelable: any = null;

        switch (type) {
            case 'MICROSOFT':
                modelable = await this.prisma.ms_text_to_speeches.create({
                    data: {
                        key: data.key,
                        region: data.region
                    }
                });
                break;
            case 'CLOUDINARY':
                modelable = await this.prisma.cloudinary_accounts.create({
                    data: {
                        cloud_name: data.cloud_name,
                        api_key: data.api_key,
                        api_secret: data.api_secret
                    }
                });
                break;
            case 'ACTIVECAMPAIGN':
                modelable = await this.prisma.active_campaign_accounts.create({
                    data: {
                        api_key: data.api_key,
                        api_url: data.api_url
                    }
                });
                break;
            case 'CHATGPT':
                // Complex logic with verification and bot updates in Laravel
                modelable = await this.prisma.ai_accounts.create({
                    data: {
                        workspace_id: workspaceId,
                        api_key: data.api_key,
                        api_url: 'https://chat.openai.com',
                        transcribe: data.transcribe || 'whisper-1'
                    }
                });
                // Update existing agents - logic from Laravel
                await this.prisma.ai_agents.updateMany({
                    where: { workspace_id: workspaceId, status: 'PAUSED' },
                    data: { account_id: modelable.id, status: 'ACTIVE' }
                });
                break;
            // Add other cases as needed: BASEROW, WOOVI, etc.
            default:
                throw new BadRequestException('Unsupported integration type');
        }

        const integration = await this.linkIntegrationModel(workspaceId, type, modelable, data.modelable_type);
        return { integration };
    }

    async updateIntegration(workspaceId: bigint, integrationId: bigint, data: any) {
        const integration = await this.prisma.integrations.findFirst({
            where: { id: integrationId, workspace_id: workspaceId }
        });
        if (!integration) throw new NotFoundException('Integration not found');

        if (data.action) {
            let status = integration.status;
            if (data.action === 'pause') status = 'PAUSED';
            else if (data.action === 'activate') status = 'ACTIVE';
            else if (data.action === 'suspend') status = 'SUSPENDED';

            await this.prisma.integrations.update({
                where: { id: integrationId },
                data: { status }
            });
        }

        return { success: true };
    }

    async removeIntegration(workspaceId: bigint, integrationId: bigint) {
        const integration = await this.prisma.integrations.findFirst({
            where: { id: integrationId, workspace_id: workspaceId }
        });
        if (!integration) throw new NotFoundException('Integration not found');

        // Logic to delete modelable
        await this.deleteModelable(integration.modelable_type, integration.modelable_id);
        await this.prisma.integrations.delete({ where: { id: integrationId } });

        return { success: true };
    }

    // ─── Shared Helpers ────────────────────────────────────────────────

    private async fetchModelable(type: string, id: bigint) {
        // Map Laravel classes to Prisma models
        if (type.includes('MSTextToSpeech')) return this.prisma.ms_text_to_speeches.findUnique({ where: { id } });
        if (type.includes('Cloudinary')) return this.prisma.cloudinary_accounts.findUnique({ where: { id } });
        if (type.includes('ActiveCampaignAccount')) return this.prisma.active_campaign_accounts.findUnique({ where: { id } });
        if (type.includes('AIAccount')) return this.prisma.ai_accounts.findUnique({ where: { id } });
        return null;
    }

    private async deleteModelable(type: string, id: bigint) {
        if (type.includes('MSTextToSpeech')) await this.prisma.ms_text_to_speeches.delete({ where: { id } });
        if (type.includes('Cloudinary')) await this.prisma.cloudinary_accounts.delete({ where: { id } });
        if (type.includes('ActiveCampaignAccount')) await this.prisma.active_campaign_accounts.delete({ where: { id } });
        if (type.includes('AIAccount')) await this.prisma.ai_accounts.delete({ where: { id } });
    }

    private async linkIntegrationModel(workspaceId: bigint, type: string, model: any, modelClassName: string) {
        return this.prisma.integrations.create({
            data: {
                workspace_id: workspaceId,
                type: type,
                modelable_type: modelClassName || 'App\\Models\\Integration', // Fallback
                modelable_id: model.id,
                status: 'ACTIVE'
            }
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
        // Complex join logic for WhatsApp, Evolution, Zapi, etc.
        const whatsapp = await this.prisma.wa_phone_numbers.findMany({
            where: { wa_accounts: { workspace_id: workspaceId } },
            include: { wa_accounts: true }
        });
        // Add others...
        return { whatsapp, evolution: [], zapi: [], messenger: [], instagram: [], telegram: [] };
    }
}
