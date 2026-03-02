// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationEventsService {
    constructor(private readonly prisma: PrismaService) { }

    async getEvents(inboxId: bigint) {
        // Stub: conversation_events model may not exist in Prisma schema
        console.log(`Stub: Getting events for inbox ${inboxId}`);
        return { events: [] };
    }

    async addEvent(data: any, userId: bigint) {
        console.log(`Stub: Adding event for inbox ${data.inbox_id}`);
        return { success: true };
    }

    async getEvent(eventId: bigint) {
        console.log(`Stub: Getting event ${eventId}`);
        return { event: null };
    }

    async deleteEvent(eventId: bigint) {
        console.log(`Stub: Deleting event ${eventId}`);
        return { success: true };
    }
}
