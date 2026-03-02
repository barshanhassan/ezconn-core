import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    // ─── Agents CRUD ────────────────────────────────────────────────────

    @Get('agents')
    async getAgents(@Request() req: any) {
        return this.aiService.getAgents(BigInt(req.user.workspace_id || 1));
    }

    @Get('agents/search')
    async searchAgents(@Request() req: any, @Body() body: any) {
        return this.aiService.searchAgents(BigInt(req.user.workspace_id || 1), body.filters, body.select);
    }

    @Get('agents/:id')
    async getAgent(@Param('id') id: string, @Request() req: any) {
        return this.aiService.getAgent(BigInt(id), BigInt(req.user.workspace_id || 1));
    }

    @Post('agents')
    async saveAgent(@Body() body: any, @Request() req: any) {
        return this.aiService.saveAgent(body, BigInt(req.user.workspace_id || 1));
    }

    @Patch('agents/:id/status')
    async updateAgentStatus(@Param('id') id: string, @Body('status') status: string, @Request() req: any) {
        return this.aiService.updateAgentStatus(BigInt(id), status, BigInt(req.user.workspace_id || 1));
    }

    @Post('agents/:id/update')
    async saveUpdateAgent(@Param('id') id: string, @Body() body: any, @Request() req: any) {
        return this.aiService.saveUpdateAgent(BigInt(id), body, BigInt(req.user.workspace_id || 1));
    }

    @Post('agents/create')
    async saveUpdateAgentNew(@Body() body: any, @Request() req: any) {
        return this.aiService.saveUpdateAgent(null, body, BigInt(req.user.workspace_id || 1));
    }

    // ─── Legacy Bot Management ──────────────────────────────────────────

    @Post('bot')
    async createBot(@Body() body: any, @Request() req: any) {
        return this.aiService.manageBot(null, body, BigInt(req.user.workspace_id || 1));
    }

    @Patch('bot/:id')
    async updateBot(@Param('id') id: string, @Body() body: any, @Request() req: any) {
        return this.aiService.manageBot(BigInt(id), body, BigInt(req.user.workspace_id || 1));
    }

    @Delete('bot/:id')
    async deleteBot(@Param('id') id: string, @Request() req: any) {
        return this.aiService.deleteBot(BigInt(id), BigInt(req.user.workspace_id || 1));
    }

    // ─── Delete Agent ───────────────────────────────────────────────────

    @Delete('agents/:id')
    async deleteAgent(@Param('id') id: string, @Body('delete_chatgpt') deleteChatgpt: boolean, @Request() req: any) {
        return this.aiService.deleteAgent(BigInt(id), BigInt(req.user.workspace_id || 1), deleteChatgpt);
    }

    // ─── Functions ──────────────────────────────────────────────────────

    @Delete('functions/:id')
    async removeFunction(@Param('id') id: string) {
        return this.aiService.removeFunction(BigInt(id));
    }

    // ─── Files ──────────────────────────────────────────────────────────

    @Post('files/delete')
    async deleteFile(@Body('agent_id') agentId: string, @Body('media_id') mediaId: string) {
        return this.aiService.deleteFile(BigInt(agentId), BigInt(mediaId));
    }

    // ─── Website Scraping ───────────────────────────────────────────────

    @Post('fetch-pages')
    async fetchPages(@Body() body: any) {
        return this.aiService.fetchPages(body);
    }

    // ─── Token Counting ─────────────────────────────────────────────────

    @Post('file-tokens')
    async getFileTokens(@Body('file_url') fileUrl: string) {
        return this.aiService.getFileTokens(fileUrl);
    }

    // ─── Toggle Feeder ──────────────────────────────────────────────────

    @Post('agents/:id/toggle-feeder')
    async toggleFeeder(@Param('id') id: string, @Request() req: any) {
        return this.aiService.toggleFeeder(BigInt(id), BigInt(req.user.workspace_id || 1));
    }

    // ─── Try cURL ───────────────────────────────────────────────────────

    @Post('try-curl')
    async trycURL(@Body('curl') curlCommand: string) {
        return this.aiService.trycURL(curlCommand);
    }

    // ─── Message Logs ───────────────────────────────────────────────────

    @Get(':botId/logs')
    async getMessageLogs(@Param('botId') botId: string) {
        return this.aiService.getMessageLogs(BigInt(botId));
    }
}
