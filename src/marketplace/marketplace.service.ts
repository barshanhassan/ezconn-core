// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get agency's own marketplace listing
   */
  async getListing(agencyId: bigint) {
    const marketplace = await this.prisma.marketplace.findFirst({
      where: { agency_id: agencyId },
      include: {
        // Assuming avatar is a relation to media/gallery
        // For now, let's just return the raw marketplace data
        // as the specific media relations might vary
      },
    });
    return { marketplace };
  }

  /**
   * Submit or Update Marketplace Listing
   */
  async submitListing(agencyId: bigint, data: any) {
    // Basic validation
    if (
      !data.representative ||
      !data.business_name ||
      !data.main_language ||
      !data.about
    ) {
      throw new BadRequestException('Required fields missing');
    }

    let marketplace = await this.prisma.marketplace.findFirst({
      where: { agency_id: agencyId },
    });

    const agency = await this.prisma.agencies.findUnique({
      where: { id: agencyId },
      include: {
        // In Laravel it checks for subscription and plan
      },
    });

    // Determine badge and priority based on plan (logic from Laravel)
    let badge: any = null;
    let priority = 0;

    // Fetch agency subscription if exists
    const subscription = await this.prisma.billing_subscriptions.findFirst({
      where: { agency_id: agencyId, status: 'active' },
    });

    if (subscription) {
      // This is a simplified check. In Laravel it uses item_id.
      // Let's assume we can find the plan details.
      if (subscription.plan_id.toString().includes('premium')) {
        badge = 'SILVER';
        priority = 1;
      } else if (subscription.plan_id.toString().includes('enterprise')) {
        badge = 'GOLD';
        priority = 2;
      }
    }

    const slug = marketplace
      ? marketplace.slug
      : this.generateSlug(data.representative);

    const updateData = {
      representative: data.representative,
      email: data.email,
      mobile_number: data.mobile_number || null,
      whatsapp_number: data.whatsapp_number || null,
      business_name: data.business_name,
      main_language: data.main_language,
      other_languages: data.other_languages || null,
      website: data.website || null,
      x: data.x || null,
      instagram: data.instagram || null,
      linkedin: data.linkedin || null,
      services:
        typeof data.services === 'string'
          ? data.services
          : JSON.stringify(data.services),
      about: data.about,
      badge: badge,
      priority: priority,
      status: 'PENDING',
      slug: slug,
    };

    if (marketplace) {
      marketplace = await this.prisma.marketplace.update({
        where: { id: marketplace.id },
        data: updateData,
      });
    } else {
      marketplace = await this.prisma.marketplace.create({
        data: {
          ...updateData,
          agency_id: agencyId,
        },
      });
    }

    // Image handling (Avatar) would go here, stubbed for now
    if (data.picture) {
      this.logger.debug('Image upload requested in marketplace submission');
      // Logic for S3 upload via GalleryHelper would be added here
    }

    return { marketplace };
  }

  /**
   * Search Partners
   */
  async searchPartners(params: any) {
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'APPROVED',
      show_in_marketplace: true,
    };

    if (params.search) {
      where.representative = { contains: params.search };
    }

    if (params.badges && params.badges.length > 0) {
      where.badge = { in: params.badges };
    }

    // Services and Languages often stored as JSON in Laravel
    // Prisma can use path filtering for JSON if supported by DB

    const [total, result] = await Promise.all([
      this.prisma.marketplace.count({ where }),
      this.prisma.marketplace.findMany({
        where,
        include: {
          agency: { select: { id: true, name: true } },
        },
        orderBy: { priority: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      result: {
        data: result,
        total,
        current_page: page,
        last_page: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get Partner Detail by Slug
   */
  async getPartner(slug: string) {
    const partner = await this.prisma.marketplace.findFirst({
      where: {
        slug: slug,
        status: 'APPROVED',
        show_in_marketplace: true,
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            users: {
              where: { roles: { some: { role: { name: 'OWNER' } } } },
              select: { id: true, email: true },
            },
          },
        },
      },
    });

    if (!partner) {
      return { success: false, partner: null };
    }

    return { success: true, partner };
  }

  private generateSlug(text: string): string {
    return (
      text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-') +
      '-' +
      Math.random().toString(36).substring(2, 7)
    );
  }
}
