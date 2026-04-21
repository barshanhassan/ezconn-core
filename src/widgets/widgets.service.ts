import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WidgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async getWidgets(workspaceId: bigint) {
    return this.prisma.widgets.findMany({
      where: { workspace_id: workspaceId },
      orderBy: { created_at: 'asc' },
    });
  }

  async createWidget(workspaceId: bigint, data: any) {
    const { id, name, title, subtitle, header_bg, body_bg, font_family, position } = data;

    if (id) {
      // Update
      const existing = await this.prisma.widgets.findFirst({
        where: { id: BigInt(id), workspace_id: workspaceId },
      });
      if (!existing) throw new NotFoundException('Widget not found');

      return this.prisma.widgets.update({
        where: { id: BigInt(id) },
        data: {
          name,
          title,
          subtitle: subtitle || '',
          header_bg,
          body_bg,
          font_family,
          position,
        },
      });
    }

    // Create
    return this.prisma.widgets.create({
      data: {
        workspace_id: workspaceId,
        name,
        title,
        subtitle: subtitle || '',
        slug: Math.random().toString(36).substring(7),
        header_bg,
        body_bg,
        font_family,
        position,
      },
    });
  }

  async deleteWidget(workspaceId: bigint, id: bigint) {
    const existing = await this.prisma.widgets.findFirst({
      where: { id, workspace_id: workspaceId },
    });
    if (!existing) throw new NotFoundException('Widget not found');

    return this.prisma.widgets.delete({
      where: { id },
    });
  }
}
