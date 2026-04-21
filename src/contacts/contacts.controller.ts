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
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly service: ContactsService) {}

  @Get()
  async getContacts(@Query() query: any, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.getContacts(workspaceId, query);
  }

  @Get(':id')
  async getContact(@Param('id') id: string, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.getContact(workspaceId, BigInt(id));
  }

  @Post()
  async addNewContact(@Body() body: any, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.addContact(workspaceId, body);
  }

  @Patch(':id')
  async updateContactData(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.updateContactData(workspaceId, BigInt(id), body);
  }

  @Post(':id/pause-automations')
  async pauseAutomations(
    @Param('id') id: string,
    @Body('minutes') minutes: number,
    @Request() req: any,
  ) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.pauseAutomations(
      workspaceId,
      BigInt(id),
      minutes || 60,
    );
  }

  @Delete(':id')
  async deleteContact(@Param('id') id: string, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.deleteContact(workspaceId, BigInt(id));
  }
}
