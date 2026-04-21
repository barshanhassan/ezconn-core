import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DifyService } from './dify.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dify')
export class DifyController {
  constructor(private readonly difyService: DifyService) {}

  @Post('bot')
  create(@Request() req: any) {
    return { message: 'Creating new Dify bot', user: req.user };
  }

  @Post('bot/:id')
  update(@Param('id') id: string, @Request() req: any) {
    return { message: `Updating Dify bot ${id}`, user: req.user };
  }

  @Get('bots')
  getBots(@Request() req: any) {
    return { message: 'Fetching all Dify bots', user: req.user };
  }

  @Get('bot/logs/:id')
  getLogs(@Param('id') id: string, @Request() req: any) {
    return { message: `Fetching logs for Dify bot ${id}`, user: req.user };
  }

  @Delete('bot/:bot_id')
  delete(@Param('bot_id') botId: string, @Request() req: any) {
    return { message: `Deleting Dify bot ${botId}`, user: req.user };
  }
}
