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

    const accountIds = accounts.map((a) => a.waba_id);

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
        waba_id: template.wa_account_id,
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
}
