import { Controller, Get, Post, Delete, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
    constructor(private readonly service: LeadsService) { }

    @Get()
    async getLeads(@Query() query: any, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.getLeads(workspaceId, query);
    }

    @Get('get/:id')
    async getLead(@Param('id') id: string, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.getLead(BigInt(id), workspaceId);
    }

    @Post('add')
    async addLead(@Body() body: any, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        const userId = BigInt(req.user.sub || 1);
        return this.service.addLead(body, workspaceId, userId);
    }

    @Post('update')
    async updateLead(@Body() body: any, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.updateLead(body, workspaceId);
    }

    @Post('trash/:id')
    async trashLead(@Param('id') id: string, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.trashLead(BigInt(id), workspaceId);
    }

    @Post('custom/:slug/update')
    async updateCustomData(@Param('slug') slug: string, @Body() body: any, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.updateCustomData(slug, body, workspaceId);
    }

    @Delete('custom/:id/delete')
    async deleteCustomField(@Param('id') id: string) {
        return this.service.deleteCustomField(BigInt(id));
    }
}
