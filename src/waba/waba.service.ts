import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WabaService {
  private readonly logger = new Logger(WabaService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTemplates(workspaceId: bigint) {
    // Find WABA accounts for this workspace
    const accounts = await this.prisma.wa_accounts.findMany({
      where: { workspace_id: workspaceId },
    });

    if (accounts.length === 0) return [];

    const accountIds = accounts.map((a) => a.id.toString());

    // Fetch templates for these accounts
    const templates = await this.prisma.wa_templates.findMany({
      where: {
        wa_account_id: { in: accountIds },
      },
      orderBy: { created_at: 'desc' },
    });

    return templates;
  }

  async getTemplate(id: bigint, workspaceId: bigint) {
    // Verification that template belongs to workspace
    const template = await this.prisma.wa_templates.findUnique({
      where: { id },
    });

    if (!template) throw new NotFoundException('Template not found');

    const account = await this.prisma.wa_accounts.findFirst({
      where: {
        id: BigInt(template.wa_account_id),
        workspace_id: workspaceId,
      },
    });

    if (!account)
      throw new NotFoundException('Template does not belong to your workspace');

    return template;
  }

  async deleteTemplate(id: bigint, workspaceId: bigint) {
    const template = await this.getTemplate(id, workspaceId);

    // In a real scenario, we might also call Meta API to delete it there
    // For now, let's just delete from DB as requested in previous sessions for other entities
    await this.prisma.wa_templates.delete({
      where: { id: template.id },
    });

    return { success: true };
  }

  async getTemplateStatistics(workspaceId: bigint) {
    const accounts = await this.prisma.wa_accounts.findMany({
      where: { workspace_id: workspaceId },
    });

    if (accounts.length === 0) {
      return {
        total: 0,
        approved: 0,
        pending: 0,
        delivered: 0,
        readRate: '0%',
        cost: '$0.00'
      };
    }

    const accountIds = accounts.map((a) => a.id.toString());

    const [total, approved, pending] = await Promise.all([
      this.prisma.wa_templates.count({
        where: { wa_account_id: { in: accountIds } }
      }),
      this.prisma.wa_templates.count({
        where: { wa_account_id: { in: accountIds }, status: 'APPROVED' }
      }),
      this.prisma.wa_templates.count({
        where: { wa_account_id: { in: accountIds }, status: 'PENDING' }
      })
    ]);

    // For delivered, readRate, and cost, we might need a different table like wa_messages or wa_logs
    // For now, I'll return some realistic counts from the templates themselves if available, 
    // or keep them as placeholders if the schema doesn't support them yet.
    
    return {
      total,
      approved,
      pending,
      delivered: 0, // TODO: Implement when messaging stats are available
      readRate: '0%',
      cost: '$0.00'
    };
  }
}
