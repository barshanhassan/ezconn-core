import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AiFeedersService } from './ai-feeders.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ai-feeders')
export class AiFeedersController {
  constructor(private readonly service: AiFeedersService) {}

  @Get()
  async getList(@Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.getList(workspaceId);
  }

  @Get(':id')
  async getFeeder(@Param('id') id: string, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.getFeeder(workspaceId, BigInt(id));
  }

  @Post()
  async addFeeder(@Body() body: any, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    const creatorId = BigInt(req.user.sub || 1);
    return this.service.addFeeder(workspaceId, creatorId, body);
  }

  @Patch(':id')
  async updateFeeder(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    const updaterId = BigInt(req.user.sub || 1);
    return this.service.updateFeeder(workspaceId, BigInt(id), updaterId, body);
  }

  @Delete(':id')
  async deleteFeeder(@Param('id') id: string, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.deleteFeeder(workspaceId, BigInt(id));
  }

  @Post(':id/questions')
  async addAQuestion(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    const creatorId = BigInt(req.user.sub || 1);
    return this.service.addAQuestion(workspaceId, BigInt(id), creatorId, body);
  }

  @Patch('questions/:qid')
  async updateAQuestion(
    @Param('qid') qid: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    const updaterId = BigInt(req.user.sub || 1);
    return this.service.updateAQuestion(
      workspaceId,
      BigInt(qid),
      updaterId,
      body,
    );
  }

  @Delete('questions/:qid')
  async deleteAQuestion(@Param('qid') qid: string, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.deleteAQuestion(workspaceId, BigInt(qid));
  }

  @Post(':id/publish')
  async publishTopic(@Param('id') id: string, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    return this.service.publishTopic(workspaceId, BigInt(id));
  }
}
