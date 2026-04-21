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
import { TriggersService } from './triggers.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('triggers')
export class TriggersController {
  constructor(private readonly triggersService: TriggersService) {}

  @Get()
  getAll(@Request() req: any) {
    return { message: 'All Triggers', user: req.user };
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Request() req: any) {
    return { message: `Trigger ${id}`, user: req.user };
  }

  @Post()
  create(@Request() req: any) {
    return { message: 'Trigger created', user: req.user };
  }

  @Put(':id')
  update(@Param('id') id: string, @Request() req: any) {
    return { message: `Trigger ${id} updated`, user: req.user };
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return { message: `Trigger ${id} deleted`, user: req.user };
  }
}
