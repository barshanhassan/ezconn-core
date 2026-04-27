import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MessagingService } from './messaging.service';

@Injectable()
export class AutomationProcessorService {
  private readonly logger = new Logger(AutomationProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messaging: MessagingService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processReservedQueue() {
    const dueItems = await this.prisma.automation_queue.findMany({
      where: {
        reserved: { lte: new Date() },
      },
    });

    if (dueItems.length > 0) {
      this.logger.log(`Resuming ${dueItems.length} delayed automations`);
      for (const item of dueItems) {
        // Clear reserved before executing to prevent double-run if execution takes long
        await this.prisma.automation_queue.update({
          where: { id: item.id },
          data: { reserved: null },
        });
        await this.executeQueueItem(item.id);
      }
    }
  }

  async triggerAutomationBulk(activityId: bigint, contactIds: bigint[]) {
    this.logger.log(`Bulk triggering automation for ${contactIds.length} contacts (Activity: ${activityId})`);
    
    const CHUNK_SIZE = 100;
    for (let i = 0; i < contactIds.length; i += CHUNK_SIZE) {
      const chunk = contactIds.slice(i, i + CHUNK_SIZE);
      // Process chunk in parallel
      await Promise.all(chunk.map(id => this.triggerAutomation(activityId, id)));
      // Small pause to prevent DB lock contention
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async triggerAutomation(activityId: bigint, contactId: bigint) {
    const activity = await this.prisma.automation_step_activities.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      this.logger.error(`Activity ${activityId} not found`);
      return;
    }

    // Find the next step via flow
    const flow = await this.prisma.automation_flow.findFirst({
      where: {
        connector_id: activity.step_id,
        connector_type: 'App\\Models\\Automations\\AutomationStep',
      },
    });

    if (!flow) {
      this.logger.warn(`No flow found for activity ${activityId}`);
      return;
    }

    // Create queue entry for the next step
    const nextStep = await this.prisma.automation_steps.findUnique({
      where: { id: flow.next_step_id },
    });

    const stepActivities = await this.prisma.automation_step_activities.findMany({
      where: { step_id: flow.next_step_id, deleted_at: null },
      orderBy: { order: 'asc' },
    });

    if (!nextStep || stepActivities.length === 0) return;

    const firstActivity = stepActivities[0];

    const queueItem = await this.prisma.automation_queue.create({
      data: {
        object_id: contactId,
        object_type: 'CONTACT',
        flow_id: flow.id,
        step_id: nextStep.id,
        activity_id: firstActivity.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return this.executeQueueItem(queueItem.id);
  }

  async executeQueueItem(queueId: bigint) {
    const queueItem = await this.prisma.automation_queue.findUnique({
      where: { id: queueId },
    });

    if (!queueItem) return;

    const activity = await this.prisma.automation_step_activities.findUnique({
      where: { id: queueItem.activity_id },
    });

    if (!activity) return;

    const step = await this.prisma.automation_steps.findUnique({
      where: { id: activity.step_id }
    });

    if (!step) return;

    this.logger.log(`Executing activity ${activity.id} (Step type: ${step.type})`);

    const stepType = step.type;
    const props = activity.properties ? (typeof activity.properties === 'string' ? JSON.parse(activity.properties) : activity.properties) : {};
    const contact = await this.prisma.contacts.findUnique({ where: { id: queueItem.object_id } });
    if (!contact) return;
    const workspaceId = contact.workspace_id;

    try {
      if (stepType === 'whatsapp') {
        await this.messaging.sendWhatsApp(queueItem.object_id, props, workspaceId);
      } else if (stepType === 'telegram') {
        await this.messaging.sendTelegram(queueItem.object_id, props, workspaceId);
      } else if (stepType === 'action') {
        await this.handleAction(queueItem.object_id, props);
      } else if (stepType === 'delay') {
        await this.handleDelay(queueId, props);
        return; // Stop execution, will be resumed by cron/worker later
      }

      // If execution finished, move to next
      return this.finished(queueId);
    } catch (error) {
      this.logger.error(`Error executing activity ${activity.id}: ${error.message}`);
    }
  }

  private async handleAction(contactId: bigint, props: any) {
    const actionSlug = props.slug;
    if (actionSlug === 'add_tag') {
      const tagId = BigInt(props.value.id);
      
      // Check if already tagged to avoid error
      const existing = await this.prisma.tag_links.findFirst({
        where: { tag_id: tagId, linkable_id: contactId, linkable_type: 'App\\Models\\Contact' }
      });

      if (!existing) {
        const tag = await this.prisma.tags.findUnique({ where: { id: tagId } });
        if (tag) {
          await this.prisma.tag_links.create({
            data: {
              tag_id: tagId,
              name: tag.name,
              linkable_id: contactId,
              linkable_type: 'App\\Models\\Contact',
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
        }
      }
    }
    // Add more actions as needed
  }

  private async handleDelay(queueId: bigint, props: any) {
    const waitAmount = parseInt(props.waitAmount) || 1;
    const waitUnit = props.waitUnit || 'minutes';
    
    let reservedDate = new Date();
    if (waitUnit === 'minutes') reservedDate.setMinutes(reservedDate.getMinutes() + waitAmount);
    else if (waitUnit === 'hours') reservedDate.setHours(reservedDate.getHours() + waitAmount);
    else if (waitUnit === 'days') reservedDate.setDate(reservedDate.getDate() + waitAmount);

    await this.prisma.automation_queue.update({
      where: { id: queueId },
      data: { reserved: reservedDate },
    });
    this.logger.log(`Delay set for queue ${queueId} until ${reservedDate}`);
  }

  private async finished(queueId: bigint) {
    const queueItem = await this.prisma.automation_queue.findUnique({
      where: { id: queueId },
    });

    if (!queueItem) return;

    // 1. Check if there are more activities in the same step
    const activity = await this.prisma.automation_step_activities.findUnique({
      where: { id: queueItem.activity_id },
    });

    const nextActivity = await this.prisma.automation_step_activities.findFirst({
      where: {
        step_id: queueItem.step_id,
        order: { gt: activity?.order || 0 },
      },
      orderBy: { order: 'asc' },
    });

    if (nextActivity) {
      const updated = await this.prisma.automation_queue.update({
        where: { id: queueId },
        data: { activity_id: nextActivity.id },
      });
      return this.executeQueueItem(updated.id);
    }

    // 2. Move to next step in flow
    const flow = await this.prisma.automation_flow.findFirst({
      where: {
        connector_id: queueItem.step_id,
        connector_type: 'App\\Models\\Automations\\AutomationStep',
      },
    });

    if (flow) {
      const nextStep = await this.prisma.automation_steps.findUnique({
        where: { id: flow.next_step_id },
      });

      const nextStepActivities = await this.prisma.automation_step_activities.findMany({
        where: { step_id: flow.next_step_id, deleted_at: null },
        orderBy: { order: 'asc' },
      });

      if (nextStep && nextStepActivities.length > 0) {
        const updated = await this.prisma.automation_queue.update({
          where: { id: queueId },
          data: {
            flow_id: flow.id,
            step_id: nextStep.id,
            activity_id: nextStepActivities[0].id,
          },
        });
        return this.executeQueueItem(updated.id);
      }
    }

    // 3. No more steps, delete queue item
    await this.prisma.automation_queue.delete({ where: { id: queueId } });
    this.logger.log(`Automation run ${queueId} finished`);
  }
}
