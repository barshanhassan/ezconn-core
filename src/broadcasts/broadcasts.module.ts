import { Module } from '@nestjs/common';
import { BroadcastsController } from './broadcasts.controller';
import { BroadcastsService } from './broadcasts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AudienceFilterService } from './audience-filter.service';
import { BroadcastProcessorService } from './broadcast-processor.service';
import { AutomationsModule } from '../automations/automations.module';

@Module({
  imports: [PrismaModule, AutomationsModule],
  controllers: [BroadcastsController],
  providers: [BroadcastsService, AudienceFilterService, BroadcastProcessorService],
  exports: [BroadcastsService, AudienceFilterService],
})
export class BroadcastsModule {}
