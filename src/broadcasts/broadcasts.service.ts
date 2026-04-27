// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AudienceFilterService } from './audience-filter.service';

@Injectable()
export class BroadcastsService {
  private readonly logger = new Logger(BroadcastsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audienceFilter: AudienceFilterService,
  ) {}

  // ─── Broadcast Campaigns ───────────────────────────────────────────

  async broadcastList(workspaceId: bigint, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 15;
    const skip = (page - 1) * limit;

    const where: any = { workspace_id: workspaceId };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.name = { contains: query.search };
    }

    const [broadcasts, total] = await Promise.all([
      this.prisma.broadcasts.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.broadcasts.count({ where }),
    ]);

    // Status counts
    const allBroadcasts = await this.prisma.broadcasts.findMany({
      where: { workspace_id: workspaceId },
      select: { status: true },
    });

    const stats = {
      total: allBroadcasts.length,
      draft: 0,
      scheduled: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    allBroadcasts.forEach((b) => {
      const status = b.status?.toLowerCase();
      if (stats.hasOwnProperty(status)) {
        stats[status]++;
      }
    });

    return {
      broadcasts,
      meta: {
        total,
        page,
        last_page: Math.ceil(total / limit),
      },
      stats,
    };
  }

  async createBroadcast(workspaceId: bigint, creatorId: bigint, data: any) {
    if (!data.name || !data.channel_type) {
      throw new BadRequestException('Name and channel_type are required');
    }

    const broadcast = await this.prisma.broadcasts.create({
      data: {
        workspace_id: workspaceId,
        creator_id: creatorId,
        name: data.name,
        channel_type: data.channel_type,
        channelable_type: data.channelable_type || '', // e.g. WhatsappAccount
        channelable_id: BigInt(data.channelable_id || 0),
        message: data.message || null,
        wa_template_id: data.wa_template_id
          ? parseInt(data.wa_template_id)
          : null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        filters: data.filters ? JSON.stringify(data.filters) : '{}',
        status: 'DRAFT' as any,
        scheduled_at: data.scheduled_at ? new Date(data.scheduled_at) : null,
        do_not_send_if_marketing: data.do_not_send_if_marketing || false,
      },
    });

    return { broadcast };
  }

  async getBroadcast(broadcastId: bigint, workspaceId: bigint) {
    const broadcast = await this.prisma.broadcasts.findFirst({
      where: { id: broadcastId, workspace_id: workspaceId },
    });

    if (!broadcast) throw new NotFoundException('Broadcast not found');

    return { broadcast };
  }

  async updateBroadcast(broadcastId: bigint, workspaceId: bigint, data: any) {
    const broadcast = await this.prisma.broadcasts.findFirst({
      where: { id: broadcastId, workspace_id: workspaceId },
    });

    if (!broadcast) throw new NotFoundException('Broadcast not found');
    if (broadcast.status !== 'DRAFT') {
      throw new BadRequestException('Only draft broadcasts can be updated');
    }

    const updated = await this.prisma.broadcasts.update({
      where: { id: broadcastId },
      data: {
        name: data.name,
        message: data.message,
        wa_template_id: data.wa_template_id
          ? parseInt(data.wa_template_id)
          : undefined,
        filters: data.filters ? JSON.stringify(data.filters) : undefined,
        scheduled_at: data.scheduled_at
          ? new Date(data.scheduled_at)
          : undefined,
        do_not_send_if_marketing: data.do_not_send_if_marketing,
        status: data.status, // e.g. to move to SCHEDULED or PENDING
      },
    });

    return { broadcast: updated };
  }

  async deleteBroadcast(broadcastId: bigint, workspaceId: bigint) {
    const broadcast = await this.prisma.broadcasts.findFirst({
      where: { id: broadcastId, workspace_id: workspaceId },
    });

    if (!broadcast) throw new NotFoundException('Broadcast not found');

    await this.prisma.broadcasts.delete({ where: { id: broadcastId } });

    return { success: true };
  }

  // ─── Audience & Stats ──────────────────────────────────────────────

  async getBroadcastAudience(
    broadcastId: bigint,
    workspaceId: bigint,
    query: any,
  ) {
    const broadcast = await this.prisma.broadcasts.findFirst({
      where: { id: broadcastId, workspace_id: workspaceId },
    });

    if (!broadcast) throw new NotFoundException('Broadcast not found');

    // Logic for filtering contacts based on broadcast.filters
    const contactIds = await this.audienceFilter.getAudienceContactIds(workspaceId, broadcast.filters || '{}');
    
    // Fetch limited contact details for the preview
    const contacts = await this.prisma.contacts.findMany({
      where: { id: { in: contactIds } },
      take: 50,
      orderBy: { id: 'desc' }
    });

    return {
      total: contactIds.length,
      contacts: contacts,
    };
  }

  async exportBroadcastAudience(broadcastId: bigint, workspaceId: bigint) {
    const broadcast = await this.prisma.broadcasts.findFirst({
      where: { id: broadcastId, workspace_id: workspaceId },
    });

    if (!broadcast) throw new NotFoundException('Broadcast not found');

    // Stub: Dispatch ExportBroadcastAudience job
    this.logger.debug(`Dispatching export job for broadcast ${broadcastId}`);

    return {
      success: true,
      message: 'Export initiated. You will be notified when the CSV is ready.',
    };
  }
}
