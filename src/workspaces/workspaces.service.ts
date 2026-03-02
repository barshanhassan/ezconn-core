// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspacesService {
    private readonly logger = new Logger(WorkspacesService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get detailed workspace info including creator and status
     */
    async getWorkspace(workspaceId: bigint) {
        const workspace = await this.prisma.workspaces.findUnique({
            where: { id: workspaceId },
            include: { users: true } // Creator info
        });
        if (!workspace) throw new NotFoundException('Workspace not found');
        return workspace;
    }

    /**
     * Update workspace settings (Naming, Branding, Limits)
     */
    async updateWorkspace(workspaceId: bigint, data: any) {
        return this.prisma.workspaces.update({
            where: { id: workspaceId },
            data: {
                name: data.name,
                status: data.status,
                // Add more fields as needed based on Laravel parity
            }
        });
    }

    /**
     * Get workspace members with Roles and status
     */
    async getMembers(workspaceId: bigint, filters: any) {
        return this.prisma.workspace_members.findMany({
            where: { workspace_id: workspaceId },
            include: {
                users: true, // Join user table
                roles: true  // Join role table
            }
        });
    }

    /**
     * Add member to workspace (Invite logic)
     */
    async addMember(workspaceId: bigint, data: any) {
        const { email, role_id } = data;
        // Logic Parity: Check if user exists, if not create as ghost
        let user = await this.prisma.users.findUnique({ where: { email } });

        if (!user) {
            // Simplified ghost user creation
            user = await this.prisma.users.create({
                data: {
                    email,
                    name: data.name || email.split('@')[0],
                    password: '', // Should be handled via invitation link
                }
            });
        }

        // Check if already a member
        const existing = await this.prisma.workspace_members.findFirst({
            where: { workspace_id: workspaceId, user_id: user.id }
        });
        if (existing) throw new BadRequestException('User already a member of this workspace');

        return this.prisma.workspace_members.create({
            data: {
                workspace_id: workspaceId,
                user_id: user.id,
                role_id: BigInt(role_id),
                status: 'ACTIVE'
            }
        });
    }

    /**
     * Delete/Remove member
     */
    async deleteMember(workspaceId: bigint, memberId: bigint) {
        return this.prisma.workspace_members.deleteMany({
            where: { id: memberId, workspace_id: workspaceId }
        });
    }
}
