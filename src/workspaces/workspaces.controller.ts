import { Controller, Get, Post, Patch, Delete, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
    constructor(private readonly service: WorkspacesService) { }

    @Get('current')
    async getWorkspace(@Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.getWorkspace(workspaceId);
    }

    @Patch('current')
    async updateWorkspace(@Body() body: any, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.updateWorkspace(workspaceId, body);
    }

    @Get('members')
    async getMembers(@Query() query: any, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.getMembers(workspaceId, query);
    }

    @Post('members')
    async addMember(@Body() body: any, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.addMember(workspaceId, body);
    }

    @Delete('members/:id')
    async deleteMember(@Param('id') id: string, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.deleteMember(workspaceId, BigInt(id));
    }
}
