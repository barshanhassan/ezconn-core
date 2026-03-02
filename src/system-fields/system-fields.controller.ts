import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SystemFieldsService } from './system-fields.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('system-fields')
export class SystemFieldsController {
    constructor(private readonly service: SystemFieldsService) { }

    @Get()
    async index() {
        return this.service.index();
    }

    @Post('inbox-visibility')
    async inboxVisibility(@Body() body: any, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        const fields = body.fields || [];
        const isActive = body.is_active === true || body.is_active === 'true';
        return this.service.inboxVisibility(workspaceId, fields, isActive);
    }

    @Get('inbox-fields')
    async getInboxFields(@Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.getInboxFields(workspaceId);
    }
}
