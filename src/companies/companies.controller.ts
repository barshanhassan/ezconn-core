import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get()
  async getCompanies(@Query() query: any, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.getCompanies(workspaceId, query);
  }

  @Get('profile/:id')
  async getProfile(@Param('id') id: string, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.getProfile(workspaceId, BigInt(id));
  }

  @Post()
  async createNew(@Body() body: any, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    const userId = BigInt(req.user.sub || 1);
    return this.service.createNew(workspaceId, userId, body);
  }

  @Patch(':id')
  async updateCompany(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.updateCompany(workspaceId, BigInt(id), body);
  }

  @Post('assign')
  async assignCompany(@Body() body: any, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.assignCompany(
      workspaceId,
      BigInt(body.contact_id),
      BigInt(body.company_id),
    );
  }

  @Post(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body('action') action: string,
    @Request() req: any,
  ) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.changeStatus(workspaceId, BigInt(id), action);
  }

  @Delete(':id')
  async deleteCompany(@Param('id') id: string, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.deleteCompany(workspaceId, BigInt(id));
  }
}
