import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('statistics')
export class StatisticsController {
    constructor(private readonly service: StatisticsService) { }

    @Get('channels')
    async getChannels(@Request() req: any, @Query() params: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.channels(workspaceId, params);
    }

    @Post('charts-data')
    async getChartsData(@Request() req: any, @Body() body: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        const userId = BigInt(req.user.sub || 1);
        return this.service.chartsData(workspaceId, userId, body);
    }

    @Get('statistics-v1')
    async getStatisticsV1(@Request() req: any, @Query() query: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        // Map query params for date range handling
        const filters = {
            date_range: query.date_range ? JSON.parse(query.date_range) : null
        };
        return this.service.statisticsV1(workspaceId, filters);
    }

    @Post('statistics-v1')
    async postStatisticsV1(@Request() req: any, @Body() body: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.statisticsV1(workspaceId, body);
    }
}
