import { Controller, Get, Post, Patch, Delete, Param, Body, Headers, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
    constructor(private readonly service: ReportsService) { }

    @Get() async index(@Request() req: any) { return this.service.index(BigInt(req.user.workspace_id || 1)); }
    @Post() async store(@Body() body: any, @Request() req: any) { return this.service.store(body, BigInt(req.user.workspace_id || 1)); }
    @Patch(':id') async update(@Param('id') id: string, @Body() body: any, @Request() req: any) { return this.service.update(BigInt(id), body, BigInt(req.user.workspace_id || 1)); }
    @Delete(':id') async destroy(@Param('id') id: string, @Request() req: any) { return this.service.destroy(BigInt(id), BigInt(req.user.workspace_id || 1)); }
    @Post(':id/run') async run(@Param('id') id: string, @Body() body: any, @Request() req: any) { return this.service.run(BigInt(id), body, BigInt(req.user.workspace_id || 1)); }
    @Post(':id/run-automation') async runFromAutomation(@Param('id') id: string, @Body() body: any, @Headers('authorization') auth: string) { return this.service.runFromAutomation(BigInt(id), body, auth); }
}
