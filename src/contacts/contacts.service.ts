// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CustomFieldsService } from '../custom-fields/custom-fields.service';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly customFieldsService: CustomFieldsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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

    const customFields = await this.customFieldsService.getEntityValues('Contact', contact.id);

    const contactWithTags = {
      ...this.serialize(contact),
      tag_links: tagLinks.map(tl => ({ tags: { name: tl.name } })),
      custom_fields: customFields,
    };

    return { success: true, contact: contactWithTags };
  }

  /**
   * Check if contact already exists by email or phone in workspace
   */
  async findExistingContact(workspaceId: bigint, email?: string, phone?: string) {
    if (email) {
      const emailRecord = await this.prisma.contact_emails.findFirst({
        where: { email, modelable_type: 'App\\Models\\Contact' },
        include: { contacts: true } // Assuming relation exists
      });
      // Since relations might be missing, we query contacts table manually
      if (emailRecord) {
        const contact = await this.prisma.contacts.findFirst({
          where: { id: emailRecord.modelable_id, workspace_id: workspaceId, deleted_at: null }
        });
        if (contact) return contact;
      }
    }

    if (phone) {
      const mobileRecord = await this.prisma.contact_mobiles.findFirst({
        where: { full_mobile_number: phone, modelable_type: 'App\\Models\\Contact' }
      });
      if (mobileRecord) {
        const contact = await this.prisma.contacts.findFirst({
          where: { id: mobileRecord.modelable_id, workspace_id: workspaceId, deleted_at: null }
        });
        if (contact) return contact;
      }
    }

    return null;
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

      // Emit event for automation
      this.eventEmitter.emit('contact.tag_applied', {
        contactId,
        tagId: tag.id,
        workspaceId
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
      // Identity Check
      const existing = await this.findExistingContact(workspaceId, data.email, data.phone);
      if (existing) return await this.getContact(workspaceId, existing.id);

      contact = await this.prisma.contacts.create({
        data: {
          ...payload,
          workspace_id: workspaceId,
          source: 'MANUAL',
          status: 'PENDING',
        },
      });

      // Save Email/Mobile
      if (data.email) {
        await this.prisma.contact_emails.create({
          data: {
            ownership_id: workspaceId,
            ownership_type: 'App\\Models\\Workspace',
            modelable_id: contact.id,
            modelable_type: 'App\\Models\\Contact',
            email: data.email,
            is_primary: 1
          }
        });
      }
      if (data.phone) {
        await this.prisma.contact_mobiles.create({
          data: {
            ownership_id: workspaceId,
            ownership_type: 'App\\Models\\Workspace',
            modelable_id: contact.id,
            modelable_type: 'App\\Models\\Contact',
            full_mobile_number: data.phone,
            country_id: BigInt(data.country_id || 1),
            is_primary: 1
          }
        });
      }
    }

    if (tags && Array.isArray(tags)) {
      await this.syncTags(workspaceId, contact.id, tags);
    }

    // Handle Custom Fields in data
    if (data.custom_fields && typeof data.custom_fields === 'object') {
      for (const [slug, value] of Object.entries(data.custom_fields)) {
        const field = await this.prisma.custom_fields.findFirst({
          where: { workspace_id: workspaceId, slug: slug }
        });
        if (field) {
          await this.customFieldsService.upsertFieldValue('Contact', contact.id, field.id, String(value));
        }
      }
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
        const cf = await this.prisma.custom_fields.findFirst({
          where: { workspace_id: workspaceId, slug: field.slug }
        });
        if (cf) {
          await this.customFieldsService.upsertFieldValue('Contact', contactId, cf.id, String(field.value));
        }
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

      if (data.custom_fields && typeof data.custom_fields === 'object') {
        for (const [slug, value] of Object.entries(data.custom_fields)) {
          const cf = await this.prisma.custom_fields.findFirst({
            where: { workspace_id: workspaceId, slug: slug }
          });
          if (cf) {
            await this.customFieldsService.upsertFieldValue('Contact', contactId, cf.id, String(value));
          }
        }
      }
    }

    return await this.getContact(workspaceId, contactId);
  }

  private serialize(obj: any) {
    return JSON.parse(
      JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
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
