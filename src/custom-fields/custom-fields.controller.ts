import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { CustomFieldsService } from './custom-fields.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('custom-fields')
export class CustomFieldsController {
  constructor(private readonly service: CustomFieldsService) {}

  @Get()
  async getCustomFields(@Query() query: any, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.getCustomFields(workspaceId, query);
  }

  @Post('field')
  async createField(@Body() body: any, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    const userId = BigInt(req.user.sub || 1);
    return this.service.createField(workspaceId, userId, body);
  }

  @Delete('field/:slug')
  async deleteCustomField(@Param('slug') slug: string, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.deleteCustomField(workspaceId, slug);
  }

  @Delete('property/:name')
  async removeProperty(@Param('name') name: string, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.removeProperty(workspaceId, name);
  }

  @Get('check-availability')
  async checkNameAvailability(
    @Query('system_name') systemName: string,
    @Request() req: any,
  ) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.checkNameAvailability(workspaceId, systemName);
  }

  @Post(':id/toggle-feeder')
  async toggleFeeder(@Param('id') id: string, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.toggleFeeder(workspaceId, BigInt(id));
  }

  // ─── Folder Management ──────────────────────────────────────────────

  @Get('folders')
  async getFolders(@Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.getFolders(workspaceId);
  }

  @Post('folder')
  async createFolder(@Body() body: any, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.createFolder(workspaceId, body);
  }

  @Post('change-folder')
  async changeFolder(@Body() body: any, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.changeFolder(
      workspaceId,
      BigInt(body.tag_id),
      body.folder_id ? BigInt(body.folder_id) : null,
    );
  }

  @Delete('folder/:id')
  async deleteFolder(@Param('id') id: string, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.deleteFolder(workspaceId, BigInt(id));
  }
}
