import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
    constructor(private readonly service: IntegrationsService) { }

    @Get()
    async getAllIntegrations(@Request() req: any) {
        return this.service.getAllIntegrations(BigInt(req.user.workspace_id || 1));
    }

    @Get('type/:type')
    async getIntegrationByType(@Param('type') type: string, @Request() req: any) {
        return this.service.getIntegrationByType(BigInt(req.user.workspace_id || 1), type);
    }

    @Post()
    async createIntegration(@Body() body: any, @Request() req: any) {
        return this.service.createIntegration(BigInt(req.user.workspace_id || 1), body);
    }

    @Patch(':id')
    async updateIntegration(@Param('id') id: string, @Body() body: any, @Request() req: any) {
        return this.service.updateIntegration(BigInt(req.user.workspace_id || 1), BigInt(id), body);
    }

    @Delete(':id')
    async removeIntegration(@Param('id') id: string, @Request() req: any) {
        return this.service.removeIntegration(BigInt(req.user.workspace_id || 1), BigInt(id));
    }

    // ─── Type Specific Endpoints ──────────────────────────────────────

    @Get('active-campaign/:account_id/data')
    async getActiveCampaignData(@Param('account_id') accountId: string, @Request() req: any) {
        return this.service.getActiveCampaignData(BigInt(req.user.workspace_id || 1), BigInt(accountId));
    }

    @Get('cloudinary/folders')
    async getCloudinaryFolders(@Request() req: any) {
        return this.service.getCloudinaryFolders(BigInt(req.user.workspace_id || 1));
    }

    @Get('channels')
    async getChannels(@Request() req: any) {
        return this.service.getChannels(BigInt(req.user.workspace_id || 1));
    }
}
