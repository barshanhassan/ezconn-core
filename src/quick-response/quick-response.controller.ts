import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { QuickResponseService } from './quick-response.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('quick-response')
export class QuickResponseController {
  constructor(private readonly service: QuickResponseService) {}

  @Get()
  async getResponse(@Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    const userId = BigInt(req.user.sub || 1);
    return this.service.getResponse(workspaceId, userId);
  }

  @Post('message')
  async createMessage(@Body() body: any, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    const userId = BigInt(req.user.sub || 1);
    return this.service.createMessage(workspaceId, userId, body);
  }

  @Post('group')
  async createGroup(@Body() body: any, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    const userId = BigInt(req.user.sub || 1);
    return this.service.createGroup(workspaceId, userId, body);
  }

  @Delete(':id')
  async deleteResponse(@Param('id') id: string, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    const userId = BigInt(req.user.sub || 1);
    return this.service.deleteResponse(workspaceId, userId, BigInt(id));
  }
}
