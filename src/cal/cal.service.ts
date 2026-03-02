// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalService {
    private readonly logger = new Logger(CalService.name);
    private readonly calApiUrl = 'https://api.cal.com/';

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get Cal.com account for a workspace
     */
    async getAccount(workspaceId: bigint, accountId?: bigint) {
        if (accountId) {
            return this.prisma.cal_accounts.findUnique({
                where: { id: accountId, workspace_id: workspaceId }
            });
        }
        return this.prisma.cal_accounts.findFirst({
            where: { workspace_id: workspaceId, is_active: true }
        });
    }

    /**
     * Get all Cal.com accounts for a workspace
     */
    async getAccounts(workspaceId: bigint) {
        return this.prisma.cal_accounts.findMany({
            where: { workspace_id: workspaceId, is_active: true }
        });
    }

    /**
     * Fetch event types from Cal.com (supports v1 and v2)
     */
    async getEventTypes(workspaceId: bigint, accountId?: bigint) {
        const account = await this.getAccount(workspaceId, accountId);
        if (!account || !account.api_key) return [];

        try {
            if (account.version === 'v2') {
                const response = await fetch(`${this.calApiUrl}v2/event-types?username=${account.username}`, {
                    headers: {
                        'Authorization': `Bearer ${account.api_key}`,
                        'cal-api-version': '2024-06-14'
                    }
                });
                const data = await response.json();
                return data.status === 'success' ? data.data : [];
            } else {
                const response = await fetch(`${this.calApiUrl}v1/event-types?apiKey=${account.api_key}`);
                const data = await response.json();
                return data.event_types || [];
            }
        } catch (e) {
            this.logger.error(`Failed to fetch event types: ${e.message}`);
            return [];
        }
    }

    /**
     * Fetch available slots (supports v1 and v2)
     */
    async getSlots(workspaceId: bigint, params: any) {
        const { account_id, booking_date, event_type_id, timezone } = params;
        const account = await this.getAccount(workspaceId, account_id ? BigInt(account_id) : undefined);
        if (!account || !account.api_key) return [];

        try {
            if (account.version === 'v2') {
                const start = new Date(booking_date).toISOString();
                const end = new Date(new Date(booking_date).getTime() + 86400000).toISOString();

                const queryParams = new URLSearchParams({
                    start,
                    end,
                    eventTypeId: event_type_id,
                    timeZone: timezone || 'UTC'
                });

                const response = await fetch(`${this.calApiUrl}v2/slots?${queryParams}`, {
                    headers: {
                        'Authorization': `Bearer ${account.api_key}`,
                        'cal-api-version': '2024-09-04'
                    }
                });
                const data = await response.json();
                // v2 returns slots grouped by date
                return data.status === 'success' ? data.data : [];
            } else {
                const queryParams = new URLSearchParams({
                    apiKey: account.api_key,
                    startTime: new Date(booking_date).toISOString(),
                    endTime: new Date(new Date(booking_date).getTime() + 86400000).toISOString(),
                    eventTypeId: event_type_id,
                    timeZone: timezone || 'UTC'
                });

                const response = await fetch(`${this.calApiUrl}v1/slots?${queryParams}`);
                const data = await response.json();
                return data.slots || [];
            }
        } catch (e) {
            this.logger.error(`Failed to fetch slots: ${e.message}`);
            return [];
        }
    }

    /**
     * Update integration status
     */
    async updateIntegration(workspaceId: bigint, id: bigint, data: any) {
        return this.prisma.cal_accounts.update({
            where: { id, workspace_id: workspaceId },
            data: {
                name: data.name,
                is_active: data.is_active,
                username: data.username
            }
        });
    }
}
