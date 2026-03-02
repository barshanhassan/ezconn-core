import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
    constructor(private readonly prisma: PrismaService) { }

    // ─── Agent CRUD ─────────────────────────────────────────────────────

    async getAgents(workspaceId: bigint) {
        const statuses = ['ACTIVE', 'FAILED', 'PENDING', 'PAUSED'];
        const agents = await this.prisma.ai_agents.findMany({
            where: { workspace_id: workspaceId, status: { in: statuses } },
            select: {
                id: true, workspace_id: true, account_id: true, name: true,
                reference_id: true, model: true, tools: true, status: true,
                allow_in_feeder: true, total_quries: true,
            },
            take: 50,
        });
        const totalActive = await this.prisma.ai_agents.count({
            where: { workspace_id: workspaceId, status: 'ACTIVE' }
        });
        return { agents, total_active: totalActive };
    }

    async getAgent(agentId: bigint, workspaceId: bigint) {
        const agent = await this.prisma.ai_agents.findFirst({
            where: { id: agentId, workspace_id: workspaceId }
        });
        if (!agent) throw new NotFoundException('Agent not found');

        const files = await this.prisma.ai_files.findMany({
            where: { agent_id: agentId }
        });
        const functions = await this.prisma.ai_functions.findMany({
            where: { agent_id: agentId }
        });

        return { agent: { ...agent, files, functions } };
    }

    async searchAgents(workspaceId: bigint, filters?: any[], selectFields?: string) {
        const where: any = { workspace_id: workspaceId };

        if (filters && Array.isArray(filters)) {
            for (const filter of filters) {
                switch (filter.condition) {
                    case 'equals':
                        where[filter.column] = filter.value;
                        break;
                    case 'not_equals':
                        where[filter.column] = { not: filter.value };
                        break;
                    case 'phrase':
                        where[filter.column] = { contains: filter.value };
                        break;
                    case 'in':
                        where[filter.column] = { in: filter.value };
                        break;
                }
            }
        }

        const agents = await this.prisma.ai_agents.findMany({ where });
        return { agents };
    }

    async updateAgentStatus(agentId: bigint, status: string, workspaceId: bigint) {
        const agent = await this.prisma.ai_agents.findFirst({
            where: { id: agentId, workspace_id: workspaceId }
        });
        if (!agent) throw new BadRequestException('Invalid request');

        if (status === 'ACTIVE') {
            const totalActive = await this.prisma.ai_agents.count({
                where: { workspace_id: workspaceId, status: 'ACTIVE' }
            });
            // Workspace limit check (stubbed — would come from workspace settings)
            const limit = 50; // Default limit
            if (totalActive >= limit) {
                throw new BadRequestException('Agent limit reached');
            }
        }

        await this.prisma.ai_agents.update({
            where: { id: agentId },
            data: { status }
        });

        const totalActive = await this.prisma.ai_agents.count({
            where: { workspace_id: workspaceId, status: 'ACTIVE' }
        });

        return { success: true, total_active: totalActive };
    }

    // ─── Save/Create Agent (v1 — simple) ────────────────────────────────

    async saveAgent(data: any, workspaceId: bigint) {
        if (!data.name) throw new BadRequestException('Name is required');

        const tools = [{ type: 'retrieval' }];
        const model = 'gpt-4-1106-preview';

        const agent = await this.prisma.ai_agents.create({ data: {
                workspace_id: workspaceId,
                account_id: BigInt(1), // Would come from integration lookup
                name: data.name,
                tools: JSON.stringify(tools),
                model,
                status: 'PENDING',
                instructions: data.instructions || '',
            }
        });

        // Stub: Call OpenAI createAssistant API
        console.log(`Stub: createAssistant API called for agent ${agent.id}`);

        // Update to ACTIVE after successful creation
        await this.prisma.ai_agents.update({
            where: { id: agent.id },
            data: { status: 'ACTIVE' }
        });

        return { success: true, agent };
    }

    // ─── Save/Update Agent (v3 — full) ──────────────────────────────────

    async saveUpdateAgent(agentId: bigint | null, data: any, workspaceId: bigint) {
        if (!data.name) throw new BadRequestException('Name is required');

        let isNewBot = true;
        let agent: any;

        if (agentId) {
            agent = await this.prisma.ai_agents.findFirst({
                where: { id: agentId, workspace_id: workspaceId }
            });
            if (!agent) throw new NotFoundException('Agent not found');
            isNewBot = false;
        }

        const diversity = data.diversity ? parseFloat(data.diversity) : 0;
        const temperature = data.creativity ? parseFloat(data.creativity) : 0;
        const model = data.model || 'gpt-4o';

        const agentData: any = {
            workspace_id: workspaceId,
            account_id: BigInt(1), // Would come from integration lookup
            name: data.name,
            instructions: data.instructions || '',
            status: 'PENDING',
            model,
            diversity,
            creativity: temperature,
            api_version: 'v3',
            history_limit: data.history_limit ? parseInt(data.history_limit) : null,
            source_type: data.source_type || null,
            max_chunk_size_tokens: data.max_chunk_size_tokens ? parseInt(data.max_chunk_size_tokens) : null,
            chunk_overlap_tokens: data.chunk_overlap_tokens ? parseInt(data.chunk_overlap_tokens) : null,
            response_tokens: data.response_tokens ? parseInt(data.response_tokens) : null,
            prompt_strategy: data.prompt_strategy || null,
        };

        if (isNewBot) {
            agent = await this.prisma.ai_agents.create({ data: agentData });
        } else {
            agent = await this.prisma.ai_agents.update({
                where: { id: agentId! },
                data: agentData
            });
        }

        // ─── Handle AI Functions ────────────────────────────────────
        const aiFunctions = data.a_i_functions || [];
        for (const fun of aiFunctions) {
            const slug = fun.name.replace(/\s+/g, '_').toLowerCase();

            const existingFn = fun.id
                ? await this.prisma.ai_functions.findFirst({ where: { id: BigInt(fun.id), agent_id: agent.id } })
                : null;

            const fnData: any = {
                name: fun.name,
                agent_id: agent.id,
                slug,
                description: fun.description || '',
                type: fun.type || 'API',
                api: fun.api || null,
                is_active: fun.is_active ?? true,
                parameters: fun.parameters ? JSON.stringify(fun.parameters) : null,
                enable_curl: fun.enable_curl ?? false,
                remove_from_sf: fun.remove_from_sf ?? false,
            };

            if (fun.type === 'API') {
                fnData.http_request = fun.http_request ? JSON.stringify(fun.http_request) : null;
            } else if (['TRIGGER_SF', 'ADD_TAG', 'BASEROW'].includes(fun.type)) {
                fnData.data = fun.data ? JSON.stringify(fun.data) : null;
            }

            if (existingFn) {
                await this.prisma.ai_functions.update({ where: { id: existingFn.id }, data: fnData });
            } else {
                await this.prisma.ai_functions.create({ data: fnData });
            }
        }

        // ─── Handle File Content Uploads ────────────────────────────
        const updateContent = data.update_content;
        if (updateContent) {
            // Delete old files
            await this.prisma.ai_files.deleteMany({ where: { agent_id: agent.id } });

            // PDF files
            const pendingFiles = data.pending_files || [];
            for (const media of pendingFiles) {
                await this.prisma.ai_files.create({ data: {
                        agent_id: agent.id,
                        gallery_media_id: media.id ? BigInt(media.id) : null,
                        url: media.file_url || null,
                        type: 'PDF',
                        tokens: media.file_size || 0,
                    }
                });
            }

            // Custom text content
            if (data.website_content) {
                const wordCount = data.website_content.split(/\s+/).length;
                await this.prisma.ai_files.create({ data: {
                        agent_id: agent.id,
                        type: 'TEXT',
                        content: data.website_content,
                        tokens: wordCount,
                    }
                });
            }

            // Website pages
            const selectedPages = data.selected_pages || [];
            const webPages = data.web_pages || [];
            for (const page of webPages) {
                if (selectedPages.includes(page.page)) {
                    const wordCount = (page.content || '').split(/\s+/).length;
                    await this.prisma.ai_files.create({ data: {
                            agent_id: agent.id,
                            url: page.page,
                            content: page.content,
                            type: 'WEBSITE',
                            tokens: wordCount,
                        }
                    });
                }
            }

            // Update total tokens
            const tokenSum = await this.prisma.ai_files.aggregate({
                where: { agent_id: agent.id },
                _sum: { tokens: true }
            });
            await this.prisma.ai_agents.update({
                where: { id: agent.id },
                data: { tokens: tokenSum._sum.tokens || 0 }
            });
        }

        // Stub: OpenAI createAssistant / updateAssistant
        console.log(`Stub: ${isNewBot ? 'createAssistant' : 'updateAssistant'} for agent ${agent.id}`);

        await this.prisma.ai_agents.update({
            where: { id: agent.id },
            data: { status: 'ACTIVE' }
        });

        // Stub: UpdateAssistant::dispatch
        console.log(`Stub: UpdateAssistant dispatched for agent ${agent.id}`);

        const finalAgent = await this.prisma.ai_agents.findUnique({ where: { id: agent.id } });
        const files = await this.prisma.ai_files.findMany({ where: { agent_id: agent.id } });
        const functions = await this.prisma.ai_functions.findMany({ where: { agent_id: agent.id } });

        return { success: true, agent: { ...finalAgent, files, functions } };
    }

    // ─── Manage Bot (legacy v2) ─────────────────────────────────────────

    async manageBot(agentId: bigint | null, data: any, workspaceId: bigint) {
        if (!data.name) throw new BadRequestException('Name is required');

        let agent: any;
        if (agentId) {
            agent = await this.prisma.ai_agents.findFirst({ where: { id: agentId, workspace_id: workspaceId } });
            if (!agent) throw new NotFoundException('Agent not found');
        }

        const model = data.model || 'gpt-4o';
        const agentData: any = {
            workspace_id: workspaceId,
            account_id: BigInt(1),
            name: data.name,
            instructions: data.instructions || '',
            status: 'PENDING',
            source_type: data.source_type || null,
            history_limit: data.history_limit ? parseInt(data.history_limit) : null,
            model,
            creativity: data.creativity ? parseFloat(data.creativity) : null,
            data: data.website || null,
        };

        if (agentId && agent) {
            agent = await this.prisma.ai_agents.update({ where: { id: agentId }, data: agentData });
        } else {
            agent = await this.prisma.ai_agents.create({ data: agentData });
        }

        // Stub: Bot creation API call
        console.log(`Stub: createBot API called for agent ${agent.id}`);
        await this.prisma.ai_agents.update({ where: { id: agent.id }, data: { status: 'ACTIVE' } });

        return { success: true, agent, consumed_tokens: 0 };
    }

    // ─── Delete Operations ──────────────────────────────────────────────

    async deleteBot(agentId: bigint, workspaceId: bigint) {
        const agent = await this.prisma.ai_agents.findFirst({
            where: { id: agentId, workspace_id: workspaceId }
        });
        if (!agent) throw new BadRequestException('Agent not found');

        // Stub: removeBot API call
        console.log(`Stub: removeBot for agent ${agentId}`);

        await this.prisma.ai_files.deleteMany({ where: { agent_id: agentId } });
        await this.prisma.ai_agents.delete({ where: { id: agentId } });

        return { success: true };
    }

    async deleteAgent(agentId: bigint, workspaceId: bigint, deleteChatgpt?: boolean) {
        const agent = await this.prisma.ai_agents.findFirst({
            where: { id: agentId, workspace_id: workspaceId }
        });
        if (!agent) throw new BadRequestException('Agent not found');

        await this.prisma.ai_agents.update({
            where: { id: agentId },
            data: { status: 'DELETED' }
        });

        // Stub: DeleteAssistant::dispatch
        console.log(`Stub: DeleteAssistant dispatched for agent ${agentId}, deleteChatgpt: ${deleteChatgpt}`);

        return { success: true };
    }

    async removeFunction(functionId: bigint) {
        await this.prisma.ai_functions.deleteMany({ where: { id: functionId } });
        return { success: true };
    }

    async deleteFile(agentId: bigint, mediaId: bigint) {
        const agent = await this.prisma.ai_agents.findFirst({ where: { id: agentId } });
        if (!agent) throw new BadRequestException('Agent not found');

        const file = await this.prisma.ai_files.findFirst({
            where: { agent_id: agentId, gallery_media_id: mediaId }
        });
        if (!file) return { success: true, agent };

        // Stub: AIHelper::deleteFile
        console.log(`Stub: deleteFile from OpenAI for file_id ${file.file_id}`);

        await this.prisma.ai_files.delete({ where: { id: file.id } });

        const files = await this.prisma.ai_files.findMany({ where: { agent_id: agentId } });
        return { success: true, agent: { ...agent, files } };
    }

    // ─── Website Scraping ───────────────────────────────────────────────

    async fetchPages(data: any) {
        const tobeProcessed = data.tobe_processed || [];
        const allUrls = data.all_urls || [];
        const sitemap = data.sitemap || false;

        let website = '';
        const pageNumber = data.page_number || 1;
        if (pageNumber === 1) {
            website = data.url || '';
            if (!website.startsWith('https://')) {
                website = 'https://' + website;
            }
        }

        // Stub: Call Web Crawler Lambda API
        // In production this calls the EC2/Lambda scraping endpoint
        console.log(`Stub: fetchPages for URL ${website}, sitemap=${sitemap}`);

        return {
            pages: [],
            processed_urls: tobeProcessed,
            all_urls: allUrls,
            errors_urls: [],
            sitemap,
        };
    }

    // ─── Token Counting ─────────────────────────────────────────────────

    async getFileTokens(fileUrl: string) {
        if (!fileUrl) return { success: false };

        // Stub: PDF parser would extract text and count words
        console.log(`Stub: getFileTokens for ${fileUrl}`);

        return { success: true, tokens: 0 };
    }

    // ─── Toggle Feeder ──────────────────────────────────────────────────

    async toggleFeeder(agentId: bigint, workspaceId: bigint) {
        const agent = await this.prisma.ai_agents.findFirst({
            where: { id: agentId, workspace_id: workspaceId }
        });
        if (!agent) throw new NotFoundException('Agent not found');

        const newValue = !agent.allow_in_feeder;
        await this.prisma.ai_agents.update({
            where: { id: agentId },
            data: { allow_in_feeder: newValue }
        });

        return { success: true, allow_in_feeder: newValue };
    }

    // ─── Message Logs ───────────────────────────────────────────────────

    async getMessageLogs(botId: bigint) {
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

        const botHistory = await this.prisma.ai_messages.findMany({
            where: {
                agent_id: botId,
                created_at: { gt: twoDaysAgo }
            },
            orderBy: { id: 'desc' },
            take: 50,
        });

        return { success: true, bot_history: botHistory };
    }

    // ─── Try cURL (Security-sensitive — stubbed) ────────────────────────

    async trycURL(curlCommand: string) {
        // SECURITY NOTE: In Gateway this directly runs shell_exec.
        // In NestJS we stub this to prevent command injection.
        console.log(`Stub: trycURL called (command execution disabled for security)`);
        return { success: false, message: 'cURL execution is stubbed for security. Implement with proper sandboxing.' };
    }
}
