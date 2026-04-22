// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get contacts with workspace scoping and basic filters
   */
  async getContacts(workspaceId: bigint, query: any) {
    const { search, status, tag_id } = query;
    const where: any = {
      workspace_id: workspaceId,
      deleted_at: null,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { first_name: { contains: search } },
        { last_name: { contains: search } },
        { full_name: { contains: search } },
      ];
    }

    if (tag_id) {
      where.tag_links = {
        some: { tag_id: BigInt(tag_id) },
      };
    }

    const contacts = await this.prisma.contacts.findMany({
      where,
      orderBy: { id: 'desc' },
      take: 50, // Default pagination limit for now
    });

    // Fetch tags manually to avoid Prisma relation errors
    const contactIds = contacts.map(c => c.id);
    const tagLinks = contactIds.length > 0 ? await this.prisma.tag_links.findMany({
      where: {
        linkable_type: 'App\\Models\\Contact',
        linkable_id: { in: contactIds }
      }
    }) : [];

    // Attach tag_links to contacts in the format the frontend expects
    const contactsWithTags = contacts.map(contact => {
      const contactTags = tagLinks.filter(tl => tl.linkable_id === contact.id);
      return {
        ...contact,
        tag_links: contactTags.map(tl => ({ tags: { name: tl.name } }))
      };
    });

    return { success: true, contacts: contactsWithTags };
  }

  /**
   * Get single contact detail
   */
  async getContact(workspaceId: bigint, contactId: bigint) {
    const contact = await this.prisma.contacts.findFirst({
      where: { id: contactId, workspace_id: workspaceId, deleted_at: null }
    });

    if (!contact) throw new NotFoundException('Contact not found');

    const tagLinks = await this.prisma.tag_links.findMany({
      where: {
        linkable_type: 'App\\Models\\Contact',
        linkable_id: contact.id
      }
    });

    const contactWithTags = {
      ...contact,
      tag_links: tagLinks.map(tl => ({ tags: { name: tl.name } }))
    };

    return { success: true, contact: contactWithTags };
  }

  /**
   * Helper to sync tags for a contact
   */
  private async syncTags(workspaceId: bigint, contactId: bigint, tagNames: string[]) {
    // 1. Remove existing tag links for this contact
    await this.prisma.tag_links.deleteMany({
      where: {
        linkable_type: 'App\\Models\\Contact',
        linkable_id: contactId
      }
    });

    if (!tagNames || tagNames.length === 0) return;

    // 2. Find or create tags by name
    for (const tagName of tagNames) {
      let tag = await this.prisma.tags.findFirst({
        where: { workspace_id: workspaceId, name: tagName }
      });
      
      if (!tag) {
        // Find an admin user to assign as creator, or use a default
        const adminUser = await this.prisma.users.findFirst({
          where: { workspace_id: workspaceId }
        });
        tag = await this.prisma.tags.create({
          data: {
            workspace_id: workspaceId,
            user_id: adminUser ? adminUser.id : BigInt(1),
            taggable_type: 'App\\Models\\Workspace',
            taggable_id: workspaceId,
            name: tagName,
            display_inbox: 0,
            bg_color: '#d3c78d',
            text_color: '#c04d30'
          }
        });
      }

      // 3. Create tag link
      await this.prisma.tag_links.create({
        data: {
          linkable_type: 'App\\Models\\Contact',
          linkable_id: contactId,
          tag_id: tag.id,
          name: tag.name
        }
      });
    }
  }

  /**
   * Add or Update a contact
   */
  async addContact(workspaceId: bigint, data: any, existingId?: bigint) {
    const {
      first_name,
      last_name,
      title,
      gender,
      language,
      timezone,
      company_id,
      tags
    } = data;

    if (!first_name && !last_name && !title) {
      throw new BadRequestException(
        'At least one of First Name, Last Name, or Title is required',
      );
    }

    const fullName = `${first_name || ''} ${last_name || ''}`.trim();

    const payload: any = {
      first_name,
      last_name,
      full_name: fullName,
      title,
      gender,
      language,
      timezone,
      company_id: company_id ? BigInt(company_id) : undefined,
    };

    let contact;
    if (existingId) {
      contact = await this.prisma.contacts.update({
        where: { id: existingId },
        data: payload,
      });
    } else {
      contact = await this.prisma.contacts.create({
        data: {
          ...payload,
          workspace_id: workspaceId,
          source: 'MANUAL',
          status: 'PENDING',
        },
      });
    }

    if (tags && Array.isArray(tags)) {
      await this.syncTags(workspaceId, contact.id, tags);
    }

    return await this.getContact(workspaceId, contact.id);
  }

  /**
   * Update specific contact data (System or Custom fields, or Bulk edit)
   */
  async updateContactData(workspaceId: bigint, contactId: bigint, data: any) {
    const contact = await this.prisma.contacts.findFirst({
      where: { id: contactId, workspace_id: workspaceId },
    });

    if (!contact) throw new NotFoundException('Contact not found');

    // Handle field/field_type style update (from contact details page)
    if (data.field && data.field_type) {
      const { field, field_type } = data;
      if (field_type === 'SYSTEM_FIELD') {
        const updatePayload = {};
        updatePayload[field.slug] = field.value;
        await this.prisma.contacts.update({
          where: { id: contactId },
          data: updatePayload,
        });
      } else if (field_type === 'CUSTOM_FIELD') {
        this.logger.log(`Updating custom field for contact ${contactId}`);
      }
    } 
    // Handle direct object update (from edit modal or bulk edit)
    else {
      const payload: any = {};
      if (data.first_name !== undefined) payload.first_name = data.first_name;
      if (data.last_name !== undefined) payload.last_name = data.last_name;
      if (data.first_name !== undefined || data.last_name !== undefined) {
         payload.full_name = `${data.first_name || contact.first_name || ''} ${data.last_name || contact.last_name || ''}`.trim();
      }
      if (data.title !== undefined) payload.title = data.title;
      
      if (Object.keys(payload).length > 0) {
        await this.prisma.contacts.update({
          where: { id: contactId },
          data: payload
        });
      }

      if (data.tags && Array.isArray(data.tags)) {
        await this.syncTags(workspaceId, contactId, data.tags);
      }
    }

    return await this.getContact(workspaceId, contactId);
  }

  /**
   * Pause flows/automations for a contact
   */
  async pauseAutomations(
    workspaceId: bigint,
    contactId: bigint,
    minutes: number,
  ) {
    const pausedTill = new Date();
    pausedTill.setMinutes(pausedTill.getMinutes() + minutes);

    await this.prisma.contacts.update({
      where: { id: contactId },
      data: { automations_paused_till: pausedTill },
    });

    return { success: true, paused_till: pausedTill };
  }

  /**
   * Delete/Trash a contact
   */
  async deleteContact(workspaceId: bigint, contactId: bigint) {
    await this.prisma.contacts.update({
      where: { id: contactId },
      data: { deleted_at: new Date() },
    });

    return { success: true };
  }
}
