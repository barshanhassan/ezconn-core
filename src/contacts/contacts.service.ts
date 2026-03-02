// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactsService {
    private readonly logger = new Logger(ContactsService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get contacts with workspace scoping and basic filters
     */
    async getContacts(workspaceId: bigint, query: any) {
        const { search, status, tag_id } = query;
        const where: any = {
            workspace_id: workspaceId,
            deleted_at: null
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
                some: { tag_id: BigInt(tag_id) }
            };
        }

        const contacts = await this.prisma.contacts.findMany({
            where,
            include: {
                tag_links: { include: { tags: true } },
                company: true,
                gallery_media: true
            },
            orderBy: { id: 'desc' },
            take: 50 // Default pagination limit for now
        });

        return { success: true, contacts };
    }

    /**
     * Get single contact detail
     */
    async getContact(workspaceId: bigint, contactId: bigint) {
        const contact = await this.prisma.contacts.findFirst({
            where: { id: contactId, workspace_id: workspaceId, deleted_at: null },
            include: {
                tag_links: { include: { tags: true } },
                custom_field_entities: { include: { custom_fields: true, custom_field_entity_values: true } },
                notes: true,
                company: true,
                gallery_media: true
            }
        });

        if (!contact) throw new NotFoundException('Contact not found');

        return { success: true, contact };
    }

    /**
     * Add or Update a contact
     */
    async addContact(workspaceId: bigint, data: any, existingId?: bigint) {
        const { first_name, last_name, title, gender, language, timezone, company_id } = data;

        if (!first_name && !last_name && !title) {
            throw new BadRequestException('At least one of First Name, Last Name, or Title is required');
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
            company_id: company_id ? BigInt(company_id) : undefined
        };

        let contact;
        if (existingId) {
            contact = await this.prisma.contacts.update({
                where: { id: existingId },
                data: payload
            });
        } else {
            contact = await this.prisma.contacts.create({
                data: {
                    ...payload,
                    workspace_id: workspaceId,
                    source: 'MANUAL',
                    status: 'PENDING'
                }
            });
        }

        return { success: true, contact };
    }

    /**
     * Update specific contact data (System or Custom fields)
     */
    async updateContactData(workspaceId: bigint, contactId: bigint, data: any) {
        const { field, field_type } = data;
        const contact = await this.prisma.contacts.findFirst({
            where: { id: contactId, workspace_id: workspaceId }
        });

        if (!contact) throw new NotFoundException('Contact not found');

        if (field_type === 'SYSTEM_FIELD') {
            // Field mapping for system fields
            const updatePayload = {};
            updatePayload[field.slug] = field.value;
            await this.prisma.contacts.update({
                where: { id: contactId },
                data: updatePayload
            });
        } else if (field_type === 'CUSTOM_FIELD') {
            // Custom field logic would involve CustomFieldEntity and values
            // Currently simplified to mirror Laravel's helper call structure
            this.logger.log(`Updating custom field for contact ${contactId}`);
            // Logic for CustomFieldEntity creation/update goes here
        }

        return { success: true, contact: await this.getContact(workspaceId, contactId) };
    }

    /**
     * Pause flows/automations for a contact
     */
    async pauseAutomations(workspaceId: bigint, contactId: bigint, minutes: number) {
        const pausedTill = new Date();
        pausedTill.setMinutes(pausedTill.getMinutes() + minutes);

        await this.prisma.contacts.update({
            where: { id: contactId },
            data: { automations_paused_till: pausedTill }
        });

        return { success: true, paused_till: pausedTill };
    }

    /**
     * Delete/Trash a contact
     */
    async deleteContact(workspaceId: bigint, contactId: bigint) {
        await this.prisma.contacts.update({
            where: { id: contactId },
            data: { deleted_at: new Date() }
        });

        return { success: true };
    }
}
