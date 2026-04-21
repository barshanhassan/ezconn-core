import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { WabaService } from './waba.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('waba')
export class WabaController {
  constructor(private readonly service: WabaService) {}

  @Get('templates')
  async getTemplates(@Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.getTemplates(workspaceId);
  }

  @Get('templates/:id')
  async getTemplate(@Param('id') id: string, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.getTemplate(BigInt(id), workspaceId);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.deleteTemplate(BigInt(id), workspaceId);
  }
}
