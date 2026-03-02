import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { BaserowService } from './baserow.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('baserow')
export class BaserowController {
    constructor(private readonly service: BaserowService) { }

    @Get('tables-and-fields')
    async getTablesAndFields(@Query('table_id') tableId: string, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        const parsedTableId = tableId ? parseInt(tableId, 10) : undefined;
        return this.service.getTablesAndFields(workspaceId, parsedTableId);
    }

    @Get('fields')
    async getFields(@Query('table_id') tableId: string, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        const parsedTableId = parseInt(tableId, 10);
        return this.service.getFields(workspaceId, parsedTableId);
    }
}
