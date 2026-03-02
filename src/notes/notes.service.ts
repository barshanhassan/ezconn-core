// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {
    private readonly logger = new Logger(NotesService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create a standard CRM text note attached to a contact.
     */
    async createNote(data: any, workspaceId: bigint, userId: bigint) {
        if (!data.contact_id) throw new BadRequestException('contact_id required');

        const note = await this.prisma.notes.create({
            data: {
                workspace_id: workspaceId,
                user_id: userId,
                contact_id: BigInt(data.contact_id),
                note: data.note || '',
                type: data.type || 'text',
            }
        });

        return { success: true, note, message: 'Note created successfully' };
    }

    /**
     * Add a complex Chat Note tied to a specific omnichannel message.
     */
    async addChatNote(data: any, workspaceId: bigint, userId: bigint) {
        if (!data.contact_id || !data.channel || !data.chat_id) {
            throw new BadRequestException('contact_id, channel, and chat_id are required');
        }

        // Validate that the conversation belongs to the workspace
        const inbox = await this.prisma.inbox.findFirst({
            where: { id: BigInt(data.chat_id), workspace_id: workspaceId }
        });

        if (!inbox) throw new NotFoundException('Conversation not found');

        // Logic parity: Tying the note to the contact AND the specific message segment
        const note = await this.prisma.notes.create({
            data: {
                workspace_id: workspaceId,
                user_id: userId,
                contact_id: BigInt(data.contact_id),
                note: data.note || '',
                type: 'chat',
                channel: data.channel,
                chat_id: BigInt(data.chat_id),
                message_id: data.message_id ? BigInt(data.message_id) : null,
            }
        });

        return { success: true, note, message: 'Chat context note attached' };
    }

    /**
     * Delete a note securely.
     */
    async deleteNote(noteId: bigint, workspaceId: bigint, userId: bigint) {
        const note = await this.prisma.notes.findFirst({
            where: { id: noteId, workspace_id: workspaceId }
        });

        if (!note) throw new NotFoundException('Note not found');

        // Enforce role checks if needed, but for now ensure ownership or workspace boundary
        await this.prisma.notes.delete({ where: { id: noteId } });

        return { success: true, message: 'Note deleted securely' };
    }

    /**
     * Paginated retrieval of notes for a specific contact.
     */
    async getNotes(contactId: bigint, workspaceId: bigint, filters: any) {
        const page = parseInt(filters.page || '1');
        const limit = parseInt(filters.limit || '20');

        const where: any = { contact_id: contactId, workspace_id: workspaceId };

        // Optional filter by type (e.g., 'text' vs 'chat')
        if (filters.type) {
            where.type = filters.type;
        }

        const [notes, total] = await Promise.all([
            this.prisma.notes.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: { users: { select: { name: true, email: true } } } // Fetch author details
            }),
            this.prisma.notes.count({ where }),
        ]);

        return {
            notes,
            total,
            page,
            limit,
            last_page: Math.ceil(total / limit)
        };
    }

    /**
     * Full CRM notes export/backup for compliance.
     */
    async getNotesBackup(contactId: bigint, workspaceId: bigint) {
        const notes = await this.prisma.notes.findMany({
            where: { contact_id: contactId, workspace_id: workspaceId },
            orderBy: { created_at: 'desc' },
            include: { users: { select: { name: true, email: true } } }
        });

        return { success: true, count: notes.length, data: notes };
    }
}
