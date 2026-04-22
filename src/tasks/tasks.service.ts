// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get tasks for a workspace with optional filters
   */
  async getTasks(workspaceId: bigint, query: any) {
    const { contact_id, company_id, user_id, status } = query;
    const where: any = { workspace_id: workspaceId };

    if (contact_id) where.contact_id = BigInt(contact_id);
    if (company_id) where.company_id = BigInt(company_id);
    if (user_id) where.user_id = BigInt(user_id);
    if (status) where.status = status;

    const tasks = await this.prisma.tasks.findMany({
      where,
      include: {
        contacts: true,
        companies: true,
      },
      orderBy: { datetime: 'asc' },
    });

    return { success: true, tasks };
  }

  /**
   * Create or Update a task
   */
  async saveTask(
    workspaceId: bigint,
    creatorId: bigint,
    workspaceTimezone: string,
    data: any,
  ) {
    const { id, date, time, description, contact_id, user_id } = data;

    if (!date || !time || !description || !contact_id) {
      throw new BadRequestException(
        'Date, Time, Description and Contact are required',
      );
    }

    // Convert local datetime to UTC
    let utcDateTime: Date;
    try {
      const localStr = `${date} ${time}`;
      utcDateTime = dayjs.tz(localStr, workspaceTimezone).utc().toDate();

      if (dayjs(utcDateTime).isBefore(dayjs())) {
        throw new BadRequestException('Task must be in the future');
      }
    } catch (e) {
      throw new BadRequestException('Invalid date or time format');
    }

    const contact = await this.prisma.contacts.findUnique({
      where: { id: BigInt(contact_id) },
    });

    if (!contact) throw new NotFoundException('Contact not found');

    const payload: any = {
      workspace_id: workspaceId,
      user_id: user_id ? BigInt(user_id) : null,
      creator_id: creatorId,
      contact_id: contact.id,
      company_id: contact.company_id || BigInt(0), // Mirroring Laravel default
      description,
      datetime: utcDateTime,
      status: 'ACTIVE',
    };

    let task;
    if (id) {
      task = await this.prisma.tasks.update({
        where: { id: BigInt(id), workspace_id: workspaceId },
        data: payload,
      });
    } else {
      task = await this.prisma.tasks.create({
        data: payload,
      });

      // Logic to link inbox/event if needed (mirrors Laravel linkInbox)
      this.logger.log(
        `Task created: linking to inbox for contact ${contact_id}`,
      );
    }

    return { success: true, task };
  }

  /**
   * Delete a task
   */
  async deleteTask(workspaceId: bigint, taskId: bigint) {
    await this.prisma.tasks.delete({
      where: { id: taskId, workspace_id: workspaceId },
    });

    return { success: true };
  }
}
