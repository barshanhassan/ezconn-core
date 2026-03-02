// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamsService {
    private readonly logger = new Logger(TeamsService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create or Update a team
     */
    async createOrUpdate(workspaceId: bigint, userId: bigint, data: any) {
        const { name, members, distribution, auto_assign, id } = data;

        if (!name || !members || !distribution) {
            throw new BadRequestException('Name, members, and distribution are required');
        }

        let team;
        if (id) {
            team = await this.prisma.teams.findUnique({ where: { id: BigInt(id), workspace_id: workspaceId } });
            if (!team) throw new NotFoundException('Team not found');

            team = await this.prisma.teams.update({
                where: { id: team.id },
                data: {
                    name,
                    distribution,
                    auto_assign: auto_assign ? 1 : 0,
                    updated_by: userId
                }
            });
        } else {
            team = await this.prisma.teams.create({
                data: {
                    workspace_id: workspaceId,
                    name,
                    distribution,
                    auto_assign: auto_assign ? 1 : 0,
                    created_by: userId,
                    updated_by: userId
                }
            });
        }

        // Handle Member Management (Syncing)
        const memberIds = [];
        for (const member of members) {
            const memberUserId = BigInt(member.id);
            memberIds.push(memberUserId);

            const existingMember = await this.prisma.team_members.findFirst({
                where: { team_id: team.id, user_id: memberUserId }
            });

            const memberData: any = {
                priority: distribution === 'PRIORITY' ? (member.priority || 0) : null,
                updater_id: userId
            };

            if (existingMember) {
                await this.prisma.team_members.update({
                    where: { id: existingMember.id },
                    data: memberData
                });
            } else {
                await this.prisma.team_members.create({
                    data: {
                        team_id: team.id,
                        user_id: memberUserId,
                        creator_id: userId,
                        updater_id: userId,
                        ...memberData
                    }
                });
            }
        }

        // Delete members not in the new list
        await this.prisma.team_members.deleteMany({
            where: {
                team_id: team.id,
                user_id: { notIn: memberIds }
            }
        });

        return { success: true, team: await this.prisma.teams.findUnique({ where: { id: team.id }, include: { team_members: { include: { users: true } } } }) };
    }

    /**
     * List all teams for a workspace
     */
    async getTeams(workspaceId: bigint) {
        const teams = await this.prisma.teams.findMany({
            where: { workspace_id: workspaceId },
            include: {
                team_members: {
                    include: {
                        users: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
            }
        });
        return { teams };
    }

    /**
     * Delete a team
     */
    async deleteTeam(workspaceId: bigint, teamId: bigint) {
        const team = await this.prisma.teams.findUnique({ where: { id: teamId, workspace_id: workspaceId } });
        if (!team) throw new NotFoundException('Team not found');

        // Delete members first
        await this.prisma.team_members.deleteMany({ where: { team_id: teamId } });
        // Delete team
        await this.prisma.teams.delete({ where: { id: teamId } });

        return { success: true };
    }
}
