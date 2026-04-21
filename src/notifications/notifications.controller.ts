import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getAll(@Request() req: any) {
    return { message: 'All Notifications', user: req.user };
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Request() req: any) {
    return { message: `Notification ${id}`, user: req.user };
  }

  @Post()
  create(@Request() req: any) {
    return { message: 'Notification created', user: req.user };
  }

  @Put(':id')
  update(@Param('id') id: string, @Request() req: any) {
    return { message: `Notification ${id} updated`, user: req.user };
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return { message: `Notification ${id} deleted`, user: req.user };
  }
}
