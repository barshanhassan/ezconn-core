import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ConversationEventsService } from './conversation-events.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('conversation-events')
export class ConversationEventsController {
    constructor(private readonly service: ConversationEventsService) { }

    @Get(':inbox_id')
    async getEvents(@Param('inbox_id') inboxId: string) {
        return this.service.getEvents(BigInt(inboxId));
    }

    @Post()
    async addEvent(@Body() body: any, @Request() req: any) {
        return this.service.addEvent(body, BigInt(req.user.sub));
    }

    @Delete(':id')
    async deleteEvent(@Param('id') id: string) {
        return this.service.deleteEvent(BigInt(id));
    }
}
