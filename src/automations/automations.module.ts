import { Module } from '@nestjs/common';
import { AutomationsController } from './automations.controller';
import { AutomationsService } from './automations.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AutomationProcessorService } from './automation-processor.service';
import { AutomationTriggerService } from './automation-trigger.service';
import { MessagingService } from './messaging.service';

@Module({
  imports: [PrismaModule],
  controllers: [AutomationsController],
  providers: [
    AutomationsService,
    AutomationProcessorService,
    AutomationTriggerService,
    MessagingService,
  ],
  exports: [AutomationsService, AutomationProcessorService, AutomationTriggerService],
})
export class AutomationsModule {}
