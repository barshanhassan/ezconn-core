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
import { IframesService } from './iframes.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('iframes')
export class IframesController {
  constructor(private readonly service: IframesService) {}

  @Get()
  async getIframes(@Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    const result = await this.service.getIframes(workspaceId);
    return {
      iframes: result.iframes.map((i: any) => ({
        ...i,
        id: i.id.toString(),
        workspace_id: i.workspace_id.toString(),
      })),
      menu_title: result.menu_title,
    };
  }

  @Post()
  async saveIframe(@Body() body: any, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    const iframe = await this.service.saveIframe(workspaceId, body);
    return {
      ...iframe,
      id: iframe.id.toString(),
      workspace_id: iframe.workspace_id.toString(),
    };
  }

  @Post('menu-title')
  async updateMenuTitle(@Body('title') title: string, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    await this.service.updateMenuTitle(workspaceId, title);
    return { success: true };
  }

  @Delete(':id')
  async deleteIframe(@Param('id') id: string, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    await this.service.deleteIframe(workspaceId, BigInt(id));
    return { success: true };
  }
}
