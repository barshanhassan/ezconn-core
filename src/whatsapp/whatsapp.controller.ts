import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('api/whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.whatsappService.getWhatsAppAccount(workspaceId);
  }

  @Patch('profile')
  async updateProfile(@Request() req, @Body() body) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.whatsappService.updateBusinessProfile(workspaceId, body);
  }
}
