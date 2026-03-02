import { Controller, Get, Post, Patch, Delete, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
import { InboxService } from './inbox.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('inbox')
export class InboxController {
    constructor(private readonly service: InboxService) { }

    @Get('get-inbox-list')
    async getInboxList(@Query() query: any, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.getInboxList(workspaceId, query);
    }

    @Get('get-inbox-item/:id')
    async getInboxItem(@Param('id') id: string, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.getInboxItem(BigInt(id), workspaceId);
    }

    @Get('get-chat-messages/:id')
    async getChatMessages(@Param('id') id: string, @Query() query: any) {
        return this.service.getChatMessages(BigInt(id), query);
    }

    @Get('get-profile-data/:id')
    async getProfileData(@Param('id') id: string) {
        return this.service.getProfileData(BigInt(id));
    }

    @Post('send-message/:id')
    async sendMessage(@Param('id') id: string, @Body() body: any, @Request() req: any) {
        const userId = BigInt(req.user.sub || 1);
        return this.service.sendMessage(BigInt(id), body, userId);
    }

    @Post('update-inbox-status')
    async updateInboxStatus(@Body() body: any, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.updateInboxStatus(BigInt(body.inbox_id), body.status, workspaceId);
    }

    @Post('assign-conversation')
    async assignConversation(@Body() body: any, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        const userId = BigInt(req.user.sub || 1);
        return this.service.assignConversation(body, workspaceId, userId);
    }

    @Post('assign-conversation-bulk')
    async assignConversationBulk(@Body() body: any, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        const userId = BigInt(req.user.sub || 1);
        const ids = body.inbox_ids.map((id: string) => BigInt(id));
        return this.service.assignConversationBulk(ids, body.assigned_to ? BigInt(body.assigned_to) : null, workspaceId);
    }

    @Post('move-to-folder')
    async moveToFolder(@Body() body: any, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        const ids = body.inbox_ids.map((id: string) => BigInt(id));
        return this.service.moveToFolder(ids, body.folder_id ? BigInt(body.folder_id) : null, workspaceId);
    }

    @Get('folders')
    async getFolders(@Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.manageFolders(workspaceId, '');
    }

    @Post('folders')
    async createFolder(@Body() body: any, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.manageFolders(workspaceId, body.name);
    }

    @Patch('folders/:id')
    async updateFolder(@Param('id') id: string, @Body() body: any, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.manageFolders(workspaceId, body.name, BigInt(id));
    }
}
