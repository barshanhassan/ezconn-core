import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationProcessorService } from './automation-processor.service';

@Injectable()
export class AutomationTriggerService {
  private readonly logger = new Logger(AutomationTriggerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: AutomationProcessorService,
  ) {}

  @OnEvent('contact.tag_applied')
  async handleTagApplied(payload: { contactId: bigint; tagId: bigint; workspaceId: bigint }) {
    this.logger.log(`Checking triggers for tag ${payload.tagId} on contact ${payload.contactId}`);

    // Find trigger activities for tag_applied
    const triggers = await this.prisma.automation_step_activities.findMany({
      where: {
        event: 'tag_applied',
        deleted_at: null,
      },
    });

    for (const trigger of triggers) {
      const step = await this.prisma.automation_steps.findUnique({
        where: { id: trigger.step_id }
      });
      if (!step) continue;

      const version = await this.prisma.automation_versions.findUnique({
        where: { id: step.automation_version_id }
      });
      if (!version) continue;

      const automation = await this.prisma.automations.findUnique({
        where: { id: version.automation_id }
      });

      if (!automation || automation.workspace_id !== payload.workspaceId || automation.status !== 'active') {
        continue;
      }

      const props = typeof trigger.properties === 'string' ? JSON.parse(trigger.properties) : trigger.properties;
      if (props?.tag?.id == payload.tagId.toString()) {
        this.logger.log(`Triggering automation ${automation.id} for contact ${payload.contactId}`);
        await this.processor.triggerAutomation(trigger.id, payload.contactId);
      }
    }
  }

  @OnEvent('opportunity.stage_moved')
  async handleOpportunityMoved(payload: { contactId: bigint; pipelineId: bigint; stageId: bigint; workspaceId: bigint }) {
    this.logger.log(`Checking triggers for opportunity move to stage ${payload.stageId}`);

    const triggers = await this.prisma.automation_step_activities.findMany({
      where: {
        event: 'opportunity_stage_moved',
        deleted_at: null,
      },
    });

    for (const trigger of triggers) {
      const step = await this.prisma.automation_steps.findUnique({
        where: { id: trigger.step_id }
      });
      if (!step) continue;

      const version = await this.prisma.automation_versions.findUnique({
        where: { id: step.automation_version_id }
      });
      if (!version) continue;

      const automation = await this.prisma.automations.findUnique({
        where: { id: version.automation_id }
      });

      if (!automation || automation.workspace_id !== payload.workspaceId || automation.status !== 'active') {
        continue;
      }

      const props = typeof trigger.properties === 'string' ? JSON.parse(trigger.properties) : trigger.properties;
      if (props?.stage?.id == payload.stageId.toString()) {
        this.logger.log(`Triggering automation ${automation.id} for contact ${payload.contactId}`);
        await this.processor.triggerAutomation(trigger.id, payload.contactId);
      }
    }
  }
}
