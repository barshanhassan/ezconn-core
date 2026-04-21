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
import { CalService } from './cal.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('cal')
export class CalController {
  constructor(private readonly service: CalService) {}

  @Get('accounts')
  async getAccounts(@Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.getAccounts(workspaceId);
  }

  @Get('event-types')
  async getEventTypes(
    @Query('account_id') accountId: string,
    @Request() req: any,
  ) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.getEventTypes(
      workspaceId,
      accountId ? BigInt(accountId) : undefined,
    );
  }

  @Get('slots')
  async getSlots(@Query() query: any, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.getSlots(workspaceId, query);
  }

  @Patch('accounts/:id')
  async updateIntegration(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.updateIntegration(workspaceId, BigInt(id), body);
  }
}
