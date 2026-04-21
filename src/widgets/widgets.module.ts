import { Module } from '@nestjs/common';
import { WidgetsController } from './widgets.controller';
import { WidgetsService } from './widgets.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [WidgetsController],
  providers: [WidgetsService, PrismaService],
})
export class WidgetsModule {}
