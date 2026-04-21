import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IframesService {
  constructor(private readonly prisma: PrismaService) {}

  async getIframes(workspaceId: bigint) {
    const iframes = await this.prisma.iframes.findMany({
      where: { workspace_id: workspaceId },
      orderBy: { created_at: 'asc' },
    });

    const menu = await this.prisma.iframe_menus.findFirst({
      where: { workspace_id: workspaceId },
    });

    return {
      iframes,
      menu_title: menu?.name || 'Iframes',
    };
  }

  async saveIframe(workspaceId: bigint, data: any) {
    const { id, name, menu_text, html_code } = data;

    if (id) {
      const existing = await this.prisma.iframes.findFirst({
        where: { id: BigInt(id), workspace_id: workspaceId },
      });
      if (!existing) throw new NotFoundException('Iframe not found');

      return this.prisma.iframes.update({
        where: { id: BigInt(id) },
        data: { name, menu: menu_text, html: html_code },
      });
    }

    // Limit check (3 max)
    const count = await this.prisma.iframes.count({
      where: { workspace_id: workspaceId },
    });
    if (count >= 3) {
      throw new Error('Maximum 3 iframes allowed');
    }

    return this.prisma.iframes.create({
      data: {
        workspace_id: workspaceId,
        name,
        menu: menu_text,
        html: html_code,
      },
    });
  }

  async deleteIframe(workspaceId: bigint, id: bigint) {
    const existing = await this.prisma.iframes.findFirst({
      where: { id, workspace_id: workspaceId },
    });
    if (!existing) throw new NotFoundException('Iframe not found');

    return this.prisma.iframes.delete({
      where: { id },
    });
  }

  async updateMenuTitle(workspaceId: bigint, title: string) {
    const existing = await this.prisma.iframe_menus.findFirst({
      where: { workspace_id: workspaceId },
    });

    if (existing) {
      return this.prisma.iframe_menus.update({
        where: { id: existing.id },
        data: { name: title },
      });
    }

    return this.prisma.iframe_menus.create({
      data: {
        workspace_id: workspaceId,
        name: title,
      },
    });
  }
}
