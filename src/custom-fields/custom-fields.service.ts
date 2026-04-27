// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomFieldsService {
  private readonly logger = new Logger(CustomFieldsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get Custom Fields for a workspace with various filters
   */
  async getCustomFields(workspaceId: bigint, params: any) {
    const where: any = { workspace_id: workspaceId };

    if (params.content_type) {
      where.content_type = params.content_type;
    }

    const folder_id = params.folder_id;
    if (folder_id === undefined || folder_id === null) {
      where.folder_id = null;
    } else if (folder_id !== 'ALL') {
      where.folder_id = BigInt(folder_id);
    }

    const fieldsRaw = await this.prisma.custom_fields.findMany({
      where,
      orderBy: { created_at: params.order === 'desc' ? 'desc' : 'asc' },
    });

    const fieldIds = fieldsRaw.map((f) => f.id);
    const properties = await this.prisma.custom_field_properties.findMany({
      where: { custom_field_id: { in: fieldIds } },
    });

    const fields = fieldsRaw.map((f) => ({
      ...f,
      custom_field_properties: properties.filter(
        (p) => p.custom_field_id === f.id,
      ),
    }));

    const totalFields = await this.prisma.custom_fields.count({
      where: { workspace_id: workspaceId },
    });

    const folders = await this.prisma.custom_field_folders.findMany({
      where: { workspace_id: workspaceId },
    });

    return {
      success: true,
      total_fields: totalFields,
      fields,
      folders,
    };
  }

  /**
   * Create or Update a Custom Field
   */
  async createField(workspaceId: bigint, userId: bigint, data: any) {
    const { label, content_type, input_type, slug, system_name, properties } =
      data;

    if (!label || !content_type || !input_type) {
      throw new BadRequestException('Required fields missing');
    }

    let field;
    if (slug) {
      // Update
      field = await this.prisma.custom_fields.findFirst({
        where: { workspace_id: workspaceId, slug: slug },
      });
      if (!field) throw new NotFoundException('Field not found');

      field = await this.prisma.custom_fields.update({
        where: { id: field.id },
        data: {
          label,
          description: data.description || null,
          validation: data.validation || null,
          list_type: data.list_type || 'create',
          fixed_value: data.fixed_value || null,
          folder_id: data.folder_id ? BigInt(data.folder_id) : field.folder_id,
        },
      });
    } else {
      // Create
      if (!system_name)
        throw new BadRequestException('System name is required');

      const existing = await this.prisma.custom_fields.findFirst({
        where: { workspace_id: workspaceId, slug: system_name },
      });
      if (existing) throw new BadRequestException('System name is taken');

      field = await this.prisma.custom_fields.create({
        data: {
          workspace_id: workspaceId,
          user_id: userId,
          modelable_id: workspaceId, // Defaulting to workspace
          modelable_type: 'Workspace',
          for: data.creating_for || 'WORKSPACE',
          label,
          slug: system_name,
          content_type,
          input_type,
          list_type: data.list_type || 'create',
          description: data.description || null,
          validation: data.validation || null,
          fixed_value: data.fixed_value || null,
          folder_id: data.folder_id ? BigInt(data.folder_id) : null,
        },
      });
    }

    // Handle Properties
    if (properties && Array.isArray(properties)) {
      // In Laravel it creates new properties. Usually we delete old ones first or sync.
      // Laravel's updateCustomField likely handles this logic.
      await this.prisma.custom_field_properties.deleteMany({
        where: { custom_field_id: field.id },
      });

      for (const prop of properties) {
        await this.prisma.custom_field_properties.create({
          data: {
            custom_field_id: field.id,
            name: prop.name || prop.label,
            value: prop.value || prop.id,
          },
        });
      }
    }

    return { success: true, field };
  }

  /**
   * Delete Custom Field
   */
  async deleteCustomField(workspaceId: bigint, slug: string) {
    const field = await this.prisma.custom_fields.findFirst({
      where: { workspace_id: workspaceId, slug: slug },
    });
    if (!field) throw new NotFoundException('Field not found');

    await this.prisma.custom_field_properties.deleteMany({
      where: { custom_field_id: field.id },
    });

    await this.prisma.custom_fields.delete({
      where: { id: field.id },
    });

    return { success: true, slug };
  }

  /**
   * Remove a single property
   */
  async removeProperty(workspaceId: bigint, propertyName: string) {
    const property = await this.prisma.custom_field_properties.findFirst({
      where: { name: propertyName },
    });

    if (!property) throw new NotFoundException('Property not found');

    const field = await this.prisma.custom_fields.findFirst({
      where: { id: property.custom_field_id },
    });

    if (!field || field.workspace_id !== workspaceId) {
      throw new NotFoundException('Property not found');
    }

    await this.prisma.custom_field_properties.delete({
      where: { id: property.id },
    });

    return { success: true };
  }

  /**
   * Slug availability check
   */
  async checkNameAvailability(workspaceId: bigint, systemName: string) {
    const name = systemName.replace(/\s+/g, '');
    if (!name) return { is_available: false };

    const exists = await this.prisma.custom_fields.findFirst({
      where: { workspace_id: workspaceId, slug: name },
    });

    return { is_available: !exists };
  }

  /**
   * Toggle Feeder
   */
  async toggleFeeder(workspaceId: bigint, fieldId: bigint) {
    const field = await this.prisma.custom_fields.findFirst({
      where: { id: fieldId, workspace_id: workspaceId },
    });
    if (!field) throw new NotFoundException('Field not found');

    const updated = await this.prisma.custom_fields.update({
      where: { id: fieldId },
      data: { allow_in_feeder: !field.allow_in_feeder },
    });

    return { success: true, allow_in_feeder: updated.allow_in_feeder };
  }

  // ─── Folder Management ──────────────────────────────────────────────

  async getFolders(workspaceId: bigint) {
    return this.prisma.custom_field_folders.findMany({
      where: { workspace_id: workspaceId },
    });
  }

  async createFolder(workspaceId: bigint, data: any) {
    if (data.id) {
      const folder = await this.prisma.custom_field_folders.findFirst({
        where: { id: BigInt(data.id), workspace_id: workspaceId },
      });
      if (!folder) throw new NotFoundException('Folder not found');

      return this.prisma.custom_field_folders.update({
        where: { id: folder.id },
        data: { name: data.name },
      });
    }

    return this.prisma.custom_field_folders.create({
      data: {
        workspace_id: workspaceId,
        name: data.name,
      },
    });
  }

  async changeFolder(
    workspaceId: bigint,
    fieldId: bigint,
    folderId: bigint | null,
  ) {
    const field = await this.prisma.custom_fields.findFirst({
      where: { id: fieldId, workspace_id: workspaceId },
    });
    if (!field) throw new NotFoundException('Field not found');

    if (folderId) {
      const folder = await this.prisma.custom_field_folders.findFirst({
        where: { id: folderId, workspace_id: workspaceId },
      });
      if (!folder) throw new NotFoundException('Folder not found');
    }

    return this.prisma.custom_fields.update({
      where: { id: fieldId },
      data: { folder_id: folderId },
    });
  }

  async deleteFolder(workspaceId: bigint, folderId: bigint) {
    const folder = await this.prisma.custom_field_folders.findFirst({
      where: { id: folderId, workspace_id: workspaceId },
    });
    if (!folder) throw new NotFoundException('Folder not found');

    const hasFields = await this.prisma.custom_fields.count({
      where: { folder_id: folderId },
    });
    if (hasFields > 0) throw new BadRequestException('Folder is not empty');

    await this.prisma.custom_field_folders.delete({
      where: { id: folderId },
    });

    return { success: true };
  }

  // ─── Value Management ──────────────────────────────────────────────

  async getEntityValues(entityType: string, entityId: bigint) {
    const entities = await this.prisma.custom_field_entities.findMany({
      where: { entity_type: entityType, entity_id: entityId },
      include: {
        custom_fields: true,
        custom_field_entity_values: true,
      },
    });

    return entities.map((e) => ({
      id: e.custom_field_id,
      label: e.custom_fields?.label,
      slug: e.custom_fields?.slug,
      value: e.custom_field_entity_values[0]?.value,
    }));
  }

  async upsertFieldValue(
    entityType: string,
    entityId: bigint,
    fieldId: bigint,
    value: string,
  ) {
    // 1. Ensure entity record exists
    let entity = await this.prisma.custom_field_entities.findFirst({
      where: {
        entity_type: entityType,
        entity_id: entityId,
        custom_field_id: fieldId,
      },
    });

    if (!entity) {
      entity = await this.prisma.custom_field_entities.create({
        data: {
          entity_type: entityType,
          entity_id: entityId,
          custom_field_id: fieldId,
        },
      });
    }

    // 2. Upsert Value
    const existingValue = await this.prisma.custom_field_entity_values.findFirst({
      where: { cf_entity_id: entity.id },
    });

    if (existingValue) {
      return this.prisma.custom_field_entity_values.update({
        where: { id: existingValue.id },
        data: { value: String(value) },
      });
    } else {
      return this.prisma.custom_field_entity_values.create({
        data: {
          cf_entity_id: entity.id,
          value: String(value),
        },
      });
    }
  }
}

