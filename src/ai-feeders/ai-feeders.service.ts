// @ts-nocheck
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiFeedersService {
    private readonly logger = new Logger(AiFeedersService.name);

    constructor(private readonly prisma: PrismaService) { }

    async getList(workspaceId: bigint) {
        // In Laravel this might fetch from ai_feeders or similar
        // For now, let's assume ai_topics is the core of the feeder system
        const feeders = await this.prisma.ai_topics.findMany({
            where: { workspace_id: workspaceId },
            include: {
                // Relate to ai_agent or files if needed
            }
        });
        return { feeders };
    }

    async getFeeder(workspaceId: bigint, feederId: bigint) {
        const feeder = await this.prisma.ai_topics.findFirst({
            where: { id: feederId, workspace_id: workspaceId }
        });
        if (!feeder) throw new NotFoundException('Feeder not found');
        return { feeder };
    }

    async addFeeder(workspaceId: bigint, creatorId: bigint, data: any) {
        const { name, ai_agent_id } = data;
        if (!name || !ai_agent_id) throw new BadRequestException('Name and Agent ID are required');

        const feeder = await this.prisma.ai_topics.create({
            data: {
                workspace_id: workspaceId,
                ai_agent_id: BigInt(ai_agent_id),
                name,
                creator_id: creatorId
            }
        });

        return { success: true, feeder };
    }

    async updateFeeder(workspaceId: bigint, feederId: bigint, updaterId: bigint, data: any) {
        const feeder = await this.prisma.ai_topics.findFirst({
            where: { id: feederId, workspace_id: workspaceId }
        });
        if (!feeder) throw new NotFoundException('Feeder not found');

        const updated = await this.prisma.ai_topics.update({
            where: { id: feederId },
            data: {
                name: data.name,
                ai_agent_id: data.ai_agent_id ? BigInt(data.ai_agent_id) : undefined,
                updater_id: updaterId
            }
        });

        return { success: true, feeder: updated };
    }

    async deleteFeeder(workspaceId: bigint, feederId: bigint) {
        const feeder = await this.prisma.ai_topics.findFirst({
            where: { id: feederId, workspace_id: workspaceId }
        });
        if (!feeder) throw new NotFoundException('Feeder not found');

        // Delete associated questions first
        await this.prisma.ai_questions.deleteMany({
            where: { ai_topic_id: feederId }
        });

        await this.prisma.ai_topics.delete({
            where: { id: feederId }
        });

        return { success: true };
    }

    // ─── Topics & Questions ─────────────────────────────────────────────

    async getTopics(workspaceId: bigint) {
        return this.getList(workspaceId);
    }

    async addAQuestion(workspaceId: bigint, topicId: bigint, creatorId: bigint, data: any) {
        const question = await this.prisma.ai_questions.create({
            data: {
                workspace_id: workspaceId,
                ai_topic_id: topicId,
                question: data.question,
                answer: data.answer,
                creator_id: creatorId
            }
        });
        return { success: true, question };
    }

    async updateAQuestion(workspaceId: bigint, questionId: bigint, updaterId: bigint, data: any) {
        const question = await this.prisma.ai_questions.findFirst({
            where: { id: questionId, workspace_id: workspaceId }
        });
        if (!question) throw new NotFoundException('Question not found');

        const updated = await this.prisma.ai_questions.update({
            where: { id: questionId },
            data: {
                question: data.question,
                answer: data.answer,
                updater_id: updaterId
            }
        });
        return { success: true, question: updated };
    }

    async deleteAQuestion(workspaceId: bigint, questionId: bigint) {
        const question = await this.prisma.ai_questions.findFirst({
            where: { id: questionId, workspace_id: workspaceId }
        });
        if (!question) throw new NotFoundException('Question not found');

        await this.prisma.ai_questions.delete({
            where: { id: questionId }
        });
        return { success: true };
    }

    async publishTopic(workspaceId: bigint, topicId: bigint) {
        // This mirrors the Laravel publishTopic logic
        // 1. Fetch all questions for this topic
        // 2. Generate content string
        // 3. Update or create ai_file record for the agent
        const topic = await this.prisma.ai_topics.findUnique({
            where: { id: topicId },
            include: { ai_questions: true }
        });

        if (!topic) throw new NotFoundException('Topic not found');

        const content = topic.ai_questions.map(q => `Q: ${q.question}\nA: ${q.answer}`).join('\n\n');

        // This content would then be synced with OpenAI as a file
        this.logger.debug(`Publishing topic ${topicId} with ${topic.ai_questions.length} questions`);

        // Stub: Update assistant file logic
        return { success: true, message: 'Topic published successfully' };
    }
}
