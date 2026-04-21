// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BundlesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Bundle CRUD ───────────────────────────────────────────────────

  async createBundle(data: any, workspaceId: number, userId: bigint) {
    if (!data.name) throw new BadRequestException('Name is required');

    const slug =
      data.slug ||
      `${data.name.toLowerCase().replace(/ /g, '-')}-${uuidv4().split('-')[0]}`;

    const bundle = await this.prisma.bundles.create({
      data: {
        workspace_id: workspaceId,
        user_id: userId,
        name: data.name,
        slug: slug,
        description: data.description || '',
        premium: data.premium || false,
        price: data.price || 0,
        published: data.published || false,
        published_at: data.published ? new Date() : null,
      },
    });
    return { bundle };
  }

  async updateBundle(bundleId: bigint, data: any, workspaceId: number) {
    const bundle = await this.prisma.bundles.findFirst({
      where: { id: bundleId, workspace_id: workspaceId },
    });
    if (!bundle) throw new NotFoundException('Bundle not found');

    const updated = await this.prisma.bundles.update({
      where: { id: bundleId },
      data: {
        name: data.name,
        description: data.description,
        premium: data.premium,
        price: data.price,
        published: data.published,
        published_at:
          data.published && !bundle.published
            ? new Date()
            : bundle.published_at,
      },
    });
    return { bundle: updated };
  }

  async getList(workspaceId: number) {
    const bundles = await this.prisma.bundles.findMany({
      where: { workspace_id: workspaceId },
      orderBy: { created_at: 'desc' },
    });
    return { bundles };
  }

  async getBundle(bundleId: bigint, workspaceId: number) {
    const bundle = await this.prisma.bundles.findFirst({
      where: { id: bundleId, workspace_id: workspaceId },
      include: { bundle_resources: true },
    });
    if (!bundle) throw new NotFoundException('Bundle not found');
    return { bundle };
  }

  async deleteBundle(bundleId: bigint, workspaceId: number) {
    const bundle = await this.prisma.bundles.findFirst({
      where: { id: bundleId, workspace_id: workspaceId },
    });
    if (!bundle) throw new NotFoundException('Bundle not found');

    await this.prisma.bundles.delete({ where: { id: bundleId } });
    return { success: true };
  }

  // ─── Sharing & Resources ──────────────────────────────────────────

  async shareBundle(bundleId: bigint, workspaceId: number, data: any) {
    const share = await this.prisma.bundle_shares.create({
      data: {
        bundle_id: bundleId,
        workspace_id: BigInt(workspaceId),
        pass_code: data.pass_code || null,
      },
    });
    return { share };
  }

  async deleteBundleSharing(shareId: bigint, workspaceId: number) {
    await this.prisma.bundle_shares.deleteMany({
      where: { id: shareId, workspace_id: BigInt(workspaceId) },
    });
    return { success: true };
  }

  async addResource(bundleId: bigint, data: any) {
    const resource = await this.prisma.bundle_resources.create({
      data: {
        bundle_id: bundleId,
        type: data.type,
        resourceable_id: BigInt(data.resourceable_id),
        resourceable_type: data.resourceable_type,
      },
    });
    return { resource };
  }

  async bulkAddResources(bundleId: bigint, resources: any[]) {
    const data = resources.map((r) => ({
      bundle_id: bundleId,
      type: r.type,
      resourceable_id: BigInt(r.resourceable_id),
      resourceable_type: r.resourceable_type,
    }));
    await this.prisma.bundle_resources.createMany({
      data,
      skipDuplicates: true,
    });
    return { success: true };
  }

  async verifyBundle(slug: string) {
    const bundle = await this.prisma.bundles.findUnique({ where: { slug } });
    if (!bundle) throw new NotFoundException('Bundle not found');
    return { bundle };
  }

  async verifyPasscode(shareId: bigint, passcode: string) {
    const share = await this.prisma.bundle_shares.findFirst({
      where: { id: shareId, pass_code: passcode },
    });
    if (!share) throw new BadRequestException('Invalid passcode');
    return { success: true };
  }

  // ─── Importing ─────────────────────────────────────────────────────

  async import(shareId: bigint, workspaceId: number) {
    const share = await this.prisma.bundle_shares.findUnique({
      where: { id: shareId },
    });
    if (!share) throw new NotFoundException('Bundle share not found');

    const bundle = await this.prisma.bundles.findUnique({
      where: { id: share.bundle_id },
      include: { bundle_resources: true },
    });

    // Stub: Detailed resource cloning logic (Automations, Tags, etc.)
    // This usually triggers an ImportBundleJob in Laravel
    console.log(
      `Stub: Importing bundle ${bundle.name} into workspace ${workspaceId}`,
    );

    await this.prisma.bundle_shares.update({
      where: { id: shareId },
      data: { consumed_at: new Date() },
    });

    return { success: true, message: 'Bundle import started' };
  }
}
