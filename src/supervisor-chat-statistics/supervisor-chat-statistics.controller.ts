import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { SupervisorChatStatisticsService } from './supervisor-chat-statistics.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('supervisor-chat-statistics')
export class SupervisorChatStatisticsController {
  constructor(private readonly service: SupervisorChatStatisticsService) {}

  @Get('team-status')
  async getTeamStatus(@Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.teamStatus(workspaceId);
  }

  @Get('leads-per-channel')
  async getLeadsPerChannel(@Request() req: any, @Query() filters: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.getLeadsPerChannelData(workspaceId, filters);
  }

  @Get('agent-performance')
  async getAgentPerformance(@Request() req: any, @Query() filters: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.getAgentPerformance(workspaceId, filters);
  }
}
