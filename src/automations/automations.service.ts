// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get list of automations with folder information
   */
  async getAutomations(workspaceId: bigint, filters: any) {
    const where: any = { workspace_id: workspaceId };

    if (filters.folder_id && filters.folder_id !== 'ALL') {
      where.folder_id = BigInt(filters.folder_id);
    } else if (filters.folder_id === undefined || filters.folder_id === null) {
      // where.folder_id = null; // Laravel seems to show root if null
    }

    const automations = await this.prisma.automations.findMany({
      where,
      orderBy: { id: 'desc' },
    });

    const folders = await this.prisma.automation_folders.findMany({
      where: { workspace_id: workspaceId },
    });

    return { success: true, automations, folders };
  }

  /**
   * Get full automation data including versions and steps
   */
  async getAutomation(workspaceId: bigint, automationId: bigint) {
    const automation = await this.prisma.automations.findFirst({
      where: { id: automationId, workspace_id: workspaceId },
      include: {
        automation_versions: {
          include: {
            automation_steps: {
              orderBy: { id: 'asc' },
            },
          },
        },
      },
    });

    if (!automation) throw new NotFoundException('Automation not found');

    return { success: true, automation };
  }

  /**
   * Create a new automation
   */
  async createAutomation(workspaceId: bigint, data: any) {
    const { name, folder_id } = data;
    if (!name) throw new BadRequestException('Name is required');

    const automation = await this.prisma.automations.create({
      data: {
        workspace_id: workspaceId,
        name,
        folder_id: folder_id ? BigInt(folder_id) : null,
        status: 'draft',
      },
    });

    // Create initial draft version
    const version = await this.prisma.automation_versions.create({
      data: {
        automation_id: automation.id,
        number: 1,
        status: 'draft',
      },
    });

    await this.prisma.automations.update({
      where: { id: automation.id },
      data: { draft_version_id: version.id },
    });

    return {
      success: true,
      automation: { ...automation, draft_version_id: version.id },
    };
  }

  /**
   * Duplicate an automation
   */
  async duplicateAutomation(workspaceId: bigint, automationId: bigint) {
    const original = await this.prisma.automations.findFirst({
      where: { id: automationId, workspace_id: workspaceId },
      include: {
        automation_versions: {
          where: { status: 'published' },
          include: { automation_steps: true },
        },
      },
    });

    if (!original) throw new NotFoundException('Original automation not found');

    const copy = await this.prisma.automations.create({
      data: {
        workspace_id: workspaceId,
        name: `${original.name} (Copy)`,
        folder_id: original.folder_id,
        status: 'draft',
      },
    });

    const publishedVersion = original.automation_versions[0];
    if (publishedVersion) {
      const newVersion = await this.prisma.automation_versions.create({
        data: {
          automation_id: copy.id,
          number: 1,
          status: 'draft',
        },
      });

      for (const step of publishedVersion.automation_steps) {
        await this.prisma.automation_steps.create({
          data: {
            automation_version_id: newVersion.id,
            title: step.title,
            type: step.type,
            properties: step.properties,
            slug: step.slug,
          },
        });
      }

      await this.prisma.automations.update({
        where: { id: copy.id },
        data: { draft_version_id: newVersion.id },
      });
    }

    return { success: true, automation: copy };
  }

  /**
   * Publish an automation
   */
  async publishAutomation(workspaceId: bigint, automationId: bigint) {
    const automation = await this.prisma.automations.findFirst({
      where: { id: automationId, workspace_id: workspaceId },
    });

    if (!automation || !automation.draft_version_id) {
      throw new BadRequestException('No draft version to publish');
    }

    const draftVersion = await this.prisma.automation_versions.findUnique({
      where: { id: BigInt(automation.draft_version_id) },
      include: { automation_steps: true },
    });

    if (!draftVersion) throw new NotFoundException('Draft version not found');

    // Create live version
    const liveVersion = await this.prisma.automation_versions.create({
      data: {
        automation_id: automation.id,
        number:
          (await this.prisma.automation_versions.count({
            where: { automation_id: automation.id },
          })) + 1,
        status: 'published',
        published_at: new Date(),
      },
    });

    // Clone steps
    for (const step of draftVersion.automation_steps) {
      await this.prisma.automation_steps.create({
        data: {
          automation_version_id: liveVersion.id,
          title: step.title,
          type: step.type,
          properties: step.properties,
          slug: step.slug,
        },
      });
    }

    await this.prisma.automations.update({
      where: { id: automation.id },
      data: {
        published_version_id: liveVersion.id,
        status: 'published',
      },
    });

    return { success: true, live_version_id: liveVersion.id };
  }

  /**
   * Step management
   */
  async createStep(versionId: bigint, data: any) {
    const step = await this.prisma.automation_steps.create({
      data: {
        automation_version_id: versionId,
        title: data.title || 'New Step',
        type: data.type || 'action',
        properties: data.properties ? JSON.stringify(data.properties) : null,
      },
    });
    return { success: true, step };
  }

  async updateStep(stepId: bigint, data: any) {
    const step = await this.prisma.automation_steps.update({
      where: { id: stepId },
      data: {
        title: data.title,
        properties: data.properties
          ? JSON.stringify(data.properties)
          : undefined,
      },
    });
    return { success: true, step };
  }

  async deleteStep(stepId: bigint) {
    await this.prisma.automation_steps.delete({ where: { id: stepId } });
    return { success: true };
  }
}
