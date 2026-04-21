// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async index(workspaceId: bigint) {
    const reports = await this.prisma.reports.findMany({
      where: { workspace_id: workspaceId },
      orderBy: { created_at: 'desc' },
    });
    return { reports };
  }

  async store(data: any, workspaceId: bigint) {
    if (!data.name || !data.type || !data.model || !data.prompt) {
      throw new BadRequestException(
        'name, type, model, and prompt are required',
      );
    }
    const report = await this.prisma.reports.create({
      data: {
        workspace_id: workspaceId,
        name: data.name,
        type: data.type,
        model: data.model,
        save_pdf: data.save_pdf || false,
        prompt: data.prompt,
      },
    });
    return { report };
  }

  async update(reportId: bigint, data: any, workspaceId: bigint) {
    const report = await this.prisma.reports.findFirst({
      where: { id: reportId, workspace_id: workspaceId },
    });
    if (!report) throw new NotFoundException('Report not found');
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.save_pdf !== undefined) updateData.save_pdf = data.save_pdf;
    if (data.prompt !== undefined) updateData.prompt = data.prompt;
    const updated = await this.prisma.reports.update({
      where: { id: reportId },
      data: updateData,
    });
    return { report: updated };
  }

  async destroy(reportId: bigint, workspaceId: bigint) {
    const report = await this.prisma.reports.findFirst({
      where: { id: reportId, workspace_id: workspaceId },
    });
    if (!report) throw new NotFoundException('Report not found');
    await this.prisma.reports.delete({ where: { id: reportId } });
    return { success: true };
  }

  async run(reportId: bigint, data: any, workspaceId: bigint) {
    const report = await this.prisma.reports.findFirst({
      where: { id: reportId, workspace_id: workspaceId },
    });
    if (!report) throw new NotFoundException('Report not found');
    await this.prisma.reports.update({
      where: { id: reportId },
      data: { run_started_at: new Date() },
    });
    // Stub: Dispatch report generation job
    console.log(
      `Stub: Generating report ${reportId} with contact ${data.contact}`,
    );
    return { report };
  }

  async runFromAutomation(reportId: bigint, data: any, authHeader: string) {
    if (authHeader !== 'replyagent-automation') {
      throw new BadRequestException('Unauthorized');
    }
    const report = await this.prisma.reports.findFirst({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Report not found');
    await this.prisma.reports.update({
      where: { id: reportId },
      data: { run_started_at: new Date() },
    });
    // Stub: Generate report synchronously
    console.log(`Stub: Generating report from automation ${reportId}`);
    return { success: true };
  }
}
