import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoles(workspaceId: bigint) {
    const roles = await this.prisma.acl_roles.findMany({
      where: {
        ownerable_id: workspaceId,
        ownerable_type: 'App\\Models\\Workspace'
      }
    });

    return roles.map(r => ({
      ...r,
      isArchived: r.status === 'ARCHIVE',
      permissions: {}, // Mock permissions for now or implement later
    }));
  }

  async createRole(workspaceId: bigint, data: any) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return this.prisma.acl_roles.create({
      data: {
        ownerable_id: workspaceId,
        ownerable_type: 'App\\Models\\Workspace',
        name: data.name,
        slug: slug,
        description: data.description || '',
        icon: data.icon || 'fa-user-tie',
        status: 'ACTIVE',
        system: false,
        admin: false,
      }
    });
  }

  async updateRole(workspaceId: bigint, roleId: bigint, data: any) {
    const role = await this.prisma.acl_roles.findFirst({
      where: {
        id: roleId,
        ownerable_id: workspaceId,
        ownerable_type: 'App\\Models\\Workspace'
      }
    });

    if (!role) throw new NotFoundException('Role not found in this workspace');

    const updateData: any = {};
    if (data.name) {
      updateData.name = data.name;
      updateData.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.icon) updateData.icon = data.icon;
    if (data.isArchived !== undefined) updateData.status = data.isArchived ? 'ARCHIVE' : 'ACTIVE';

    return this.prisma.acl_roles.update({
      where: { id: roleId },
      data: updateData,
    });
  }

  async deleteRole(workspaceId: bigint, roleId: bigint) {
    return this.prisma.acl_roles.deleteMany({
      where: {
        id: roleId,
        ownerable_id: workspaceId,
        ownerable_type: 'App\\Models\\Workspace'
      }
    });
  }
}

