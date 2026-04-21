import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WidgetsService } from './widgets.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('widgets')
export class WidgetsController {
  constructor(private readonly service: WidgetsService) {}

  @Get()
  async getWidgets(@Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    const widgets = await this.service.getWidgets(workspaceId);
    return widgets.map((w: any) => ({
      ...w,
      id: w.id.toString(),
      workspace_id: w.workspace_id.toString(),
    }));
  }

  @Post()
  async createWidget(@Body() body: any, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    const widget = await this.service.createWidget(workspaceId, body);
    return {
      ...widget,
      id: widget.id.toString(),
      workspace_id: widget.workspace_id.toString(),
    };
  }

  @Delete(':id')
  async deleteWidget(@Param('id') id: string, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    await this.service.deleteWidget(workspaceId, BigInt(id));
    return { success: true };
  }
}
