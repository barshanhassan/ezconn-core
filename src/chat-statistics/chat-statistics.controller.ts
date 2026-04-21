import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ChatStatisticsService } from './chat-statistics.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('chat-statistics')
export class ChatStatisticsController {
  constructor(private readonly service: ChatStatisticsService) {}

  @Get('stats')
  async getStats(@Request() req: any, @Query() filters: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.getStats(workspaceId, filters);
  }

  @Get('messages-data')
  async getMessagesData(@Request() req: any, @Query() filters: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.getMessagesData(workspaceId, filters);
  }

  @Get('hourly-messages')
  async getHourlyMessages(@Request() req: any, @Query() filters: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.getHourlyMessagesData(workspaceId, filters);
  }

  @Get('time-to-conclude')
  async getTimeToConclude(@Request() req: any, @Query() filters: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.getTimeToConcludeData(workspaceId, filters);
  }

  @Get('ai-stats')
  async getAiStats(@Request() req: any, @Query() filters: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.getAiStats(workspaceId, filters);
  }
}
