// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemFieldsService {
  private readonly logger = new Logger(SystemFieldsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all system fields
   */
  async index() {
    const fields = await this.prisma.system_fields.findMany();
    return { fields };
  }

  /**
   * Update inbox visibility for multiple fields
   * @param workspaceId
   * @param fields
   * @param isActive
   */
  async inboxVisibility(
    workspaceId: bigint,
    fields: string[],
    isActive: boolean,
  ) {
    // Iterate through each field and updateOrCreate logic from Laravel
    for (const field of fields) {
      const existing = await this.prisma.inbox_system_fields.findFirst({
        where: {
          workspace_id: Number(workspaceId),
          value: field,
        },
      });

      if (existing) {
        await this.prisma.inbox_system_fields.update({
          where: { id: existing.id },
          data: { is_active: isActive },
        });
      } else {
        await this.prisma.inbox_system_fields.create({
          data: {
            workspace_id: Number(workspaceId),
            value: field,
            is_active: isActive,
          },
        });
      }
    }

    return this.getInboxFields(workspaceId);
  }

  /**
   * Get active inbox fields for a workspace
   * @param workspaceId
   */
  async getInboxFields(workspaceId: bigint) {
    const activeFields = await this.getActiveFields(workspaceId);
    return {
      success: true,
      fields: activeFields,
    };
  }

  /**
   * Helper to get active field values (plucked and unique)
   * @param workspaceId
   */
  async getActiveFields(workspaceId: bigint) {
    const records = await this.prisma.inbox_system_fields.findMany({
      where: {
        workspace_id: Number(workspaceId),
        is_active: true,
      },
      select: { value: true },
    });

    // Use Set to get unique values and return as array
    const uniqueValues = [...new Set(records.map((r) => r.value))];
    return uniqueValues;
  }
}
