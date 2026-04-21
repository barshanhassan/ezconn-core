// @ts-nocheck
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BaserowService {
  private readonly logger = new Logger(BaserowService.name);
  private readonly baseUrl = 'https://api.baserow.io/api';

  constructor(private readonly prisma: PrismaService) {}

  async getTablesAndFields(workspaceId: bigint, tableId?: number) {
    const account = await this.prisma.baserow_accounts.findFirst({
      where: { workspace_id: workspaceId },
    });

    if (!account) {
      throw new NotFoundException('Baserow account not found');
    }

    const tables = JSON.parse(account.tables || '[]');
    const targetTableId = tableId || (tables.length > 0 ? tables[0].id : null);

    if (!targetTableId) {
      return {
        tables: tables,
        fields: [],
      };
    }

    const fields = await this.fetchFields(account.access_token, targetTableId);

    // Map fields to only include id, name, type as in Laravel
    const mappedFields = fields.map((field) => ({
      id: field.id,
      name: field.name,
      type: field.type,
    }));

    return {
      tables: tables,
      fields: mappedFields,
    };
  }

  async getFields(workspaceId: bigint, tableId: number) {
    const account = await this.prisma.baserow_accounts.findFirst({
      where: { workspace_id: workspaceId },
    });

    if (!account) {
      throw new NotFoundException('Baserow account not found');
    }

    const fields = await this.fetchFields(account.access_token, tableId);
    const tables = JSON.parse(account.tables || '[]');

    return {
      tables: tables,
      fields: fields,
    };
  }

  private async fetchFields(accessToken: string, tableId: number) {
    try {
      const response = await fetch(
        `${this.baseUrl}/database/fields/table/${tableId}/`,
        {
          headers: {
            Authorization: `Token ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        this.logger.error(`Baserow API error: ${response.statusText}`);
        return [];
      }

      return await response.json();
    } catch (error) {
      this.logger.error(
        `Failed to fetch fields from Baserow: ${error.message}`,
      );
      return [];
    }
  }
}
