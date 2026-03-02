import { Controller, Get, Post, Patch, Delete, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('automations')
export class AutomationsController {
    constructor(private readonly service: AutomationsService) { }

    @Get()
    async getAutomations(@Query() query: any, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.getAutomations(workspaceId, query);
    }

    @Get(':id')
    async getAutomation(@Param('id') id: string, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.getAutomation(workspaceId, BigInt(id));
    }

    @Post()
    async createAutomation(@Body() body: any, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.createAutomation(workspaceId, body);
    }

    @Post(':id/duplicate')
    async duplicateAutomation(@Param('id') id: string, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.duplicateAutomation(workspaceId, BigInt(id));
    }

    @Post(':id/publish')
    async publishAutomation(@Param('id') id: string, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.publishAutomation(workspaceId, BigInt(id));
    }

    // ─── Step Management ──────────────────────────────────────────────

    @Post('version/:versionId/step')
    async createStep(@Param('versionId') versionId: string, @Body() body: any) {
        return this.service.createStep(BigInt(versionId), body);
    }

    @Patch('step/:stepId')
    async updateStep(@Param('stepId') stepId: string, @Body() body: any) {
        return this.service.updateStep(BigInt(stepId), body);
    }

    @Delete('step/:stepId')
    async deleteStep(@Param('stepId') stepId: string) {
        return this.service.deleteStep(BigInt(stepId));
    }
}
