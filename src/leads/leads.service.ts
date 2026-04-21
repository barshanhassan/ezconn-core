// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Advanced leads querying with filtering, sorting, and pagination.
   */
  async getLeads(workspaceId: bigint, filters: any) {
    const page = parseInt(filters.page || '1');
    const limit = parseInt(filters.limit || '15');
    const where: any = {
      workspace_id: workspaceId,
      type: 'lead',
      deleted_at: null,
    };

    // Parity with ContactHelper Search
    if (filters.search) {
      where.OR = [
        { first_name: { contains: filters.search } },
        { last_name: { contains: filters.search } },
        { email: { contains: filters.search } },
        { phone: { contains: filters.search } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    // Tag matching logic (Laravel whereHas tags)
    if (
      filters.tags &&
      Array.isArray(filters.tags) &&
      filters.tags.length > 0
    ) {
      where.tags = { some: { id: { in: filters.tags.map((t) => BigInt(t)) } } };
    }

    const orderBy = filters.sort_by
      ? { [filters.sort_by]: filters.sort_order || 'desc' }
      : { created_at: 'desc' };

    const [leads, total] = await Promise.all([
      this.prisma.contacts.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          custom_field_entities: {
            include: { custom_field_entity_values: true },
          },
          tags: true,
        },
      }),
      this.prisma.contacts.count({ where }),
    ]);

    // Map custom data
    const mappedLeads = leads.map((lead) => this.prepareLeadData(lead));

    return {
      leads: mappedLeads,
      total,
      page,
      limit,
      last_page: Math.ceil(total / limit),
    };
  }

  /**
   * Prepare custom lead formatting and profile completion.
   */
  prepareLeadData(lead: any) {
    const customData = {};
    let filledFields = 0;
    let totalFields = 0; // Simplified estimation. In Laravel, it checks total defined workspace custom fields.

    if (lead.custom_field_entities && lead.custom_field_entities.length > 0) {
      const entity = lead.custom_field_entities[0];
      if (entity && entity.custom_field_entity_values) {
        entity.custom_field_entity_values.forEach((val) => {
          customData[val.slug] = val.value;
          totalFields++;
          if (val.value) filledFields++;
        });
      }
    }

    // Calculate profile rating/completion
    const baseFields = ['first_name', 'last_name', 'email', 'phone'];
    baseFields.forEach((f) => {
      totalFields++;
      if (lead[f]) filledFields++;
    });

    const profile_completion =
      totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    return {
      ...lead,
      custom_data: customData,
      profile_completion,
    };
  }

  async getLead(leadId: bigint, workspaceId: bigint) {
    const lead = await this.prisma.contacts.findFirst({
      where: { id: leadId, workspace_id: workspaceId, type: 'lead' },
      include: {
        custom_field_entities: {
          include: { custom_field_entity_values: true },
        },
        tags: true,
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    return this.prepareLeadData(lead);
  }

  async addLead(data: any, workspaceId: bigint, userId: bigint) {
    const leadData: any = {
      workspace_id: workspaceId,
      creator_id: userId,
      type: 'lead',
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      email: data.email || null,
      phone: data.phone || null,
      source: data.source || 'manual',
      status: data.status || 'new',
    };
    if (data.company_id) leadData.company_id = BigInt(data.company_id);

    const lead = await this.prisma.contacts.create({ data: leadData });

    // Handle custom fields mapping equivalent to Controller's logic
    if (data.custom_fields && typeof data.custom_fields === 'object') {
      const entity = await this.prisma.custom_field_entities.create({
        data: {
          entity_id: lead.id,
          entity_type: 'contact',
          workspace_id: workspaceId,
        },
      });
      for (const [slug, value] of Object.entries(data.custom_fields)) {
        await this.prisma.custom_field_entity_values.create({
          data: { entity_id: entity.id, slug, value: String(value) },
        });
      }
    }
    return {
      success: true,
      lead: this.prepareLeadData({ ...lead, custom_field_entities: [] }),
    };
  }

  async updateLead(data: any, workspaceId: bigint) {
    if (!data.id) throw new BadRequestException('Lead ID required');
    const lead = await this.prisma.contacts.findFirst({
      where: { id: BigInt(data.id), workspace_id: workspaceId },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    const updateData: any = {};
    ['first_name', 'last_name', 'email', 'phone', 'status', 'source'].forEach(
      (key) => {
        if (data[key] !== undefined) updateData[key] = data[key];
      },
    );

    if (data.company_id !== undefined)
      updateData.company_id = data.company_id ? BigInt(data.company_id) : null;

    const updated = await this.prisma.contacts.update({
      where: { id: lead.id },
      data: updateData,
      include: {
        custom_field_entities: {
          include: { custom_field_entity_values: true },
        },
        tags: true,
      },
    });

    return { success: true, lead: this.prepareLeadData(updated) };
  }

  async trashLead(leadId: bigint, workspaceId: bigint) {
    const lead = await this.prisma.contacts.findFirst({
      where: { id: leadId, workspace_id: workspaceId },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    await this.prisma.contacts.update({
      where: { id: leadId },
      data: { deleted_at: new Date() },
    });
    return { success: true, message: 'Lead moved to trash' };
  }

  async updateCustomData(slug: string, data: any, workspaceId: bigint) {
    if (!data.contact_id) throw new BadRequestException('contact_id required');

    // Find existing custom entity mapping
    let entity = await this.prisma.custom_field_entities.findFirst({
      where: { entity_id: BigInt(data.contact_id), entity_type: 'contact' },
    });

    if (!entity) {
      entity = await this.prisma.custom_field_entities.create({
        data: {
          entity_id: BigInt(data.contact_id),
          entity_type: 'contact',
          workspace_id: workspaceId,
        },
      });
    }

    // Upsert the specific SLUG value
    const existingValue =
      await this.prisma.custom_field_entity_values.findFirst({
        where: { entity_id: entity.id, slug },
      });

    if (existingValue) {
      await this.prisma.custom_field_entity_values.update({
        where: { id: existingValue.id },
        data: { value: data.value === null ? '' : String(data.value) },
      });
    } else {
      await this.prisma.custom_field_entity_values.create({
        data: {
          entity_id: entity.id,
          slug,
          value: data.value === null ? '' : String(data.value),
        },
      });
    }

    return { success: true, message: 'Custom data updated successfully' };
  }

  async deleteCustomField(valueId: bigint) {
    await this.prisma.custom_field_entity_values.deleteMany({
      where: { id: valueId },
    });
    return { success: true, message: 'Custom field value removed' };
  }
}
