import { Controller, Get, Post, Delete, Body, UseGuards, Request, Param } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
    constructor(private readonly teamsService: TeamsService) { }

    @Get('get-all')
    async getTeams(@Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.teamsService.getTeams(workspaceId);
    }

    @Post('create')
    async createTeam(@Body() body: any, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        const userId = BigInt(req.user.sub || 1);
        return this.teamsService.createOrUpdate(workspaceId, userId, body);
    }

    @Delete(':id')
    async deleteTeam(@Param('id') id: string, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.teamsService.deleteTeam(workspaceId, BigInt(id));
    }
}
