// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get list of companies for a workspace
   */
  async getCompanies(workspaceId: bigint, query: any) {
    const { search, status } = query;
    const where: any = {
      workspace_id: workspaceId,
      deleted_at: null,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const companies = await this.prisma.companies.findMany({
      where,
      include: {
        gallery_media: true,
        _count: {
          select: { contacts: true },
        },
      },
      orderBy: { id: 'desc' },
    });

    return { success: true, companies };
  }

  /**
   * Get detailed company profile
   */
  async getProfile(workspaceId: bigint, companyId: bigint) {
    const company = await this.prisma.companies.findFirst({
      where: { id: companyId, workspace_id: workspaceId, deleted_at: null },
      include: {
        gallery_media: true,
        contacts: {
          where: { deleted_at: null },
          take: 10,
        },
        custom_field_entities: {
          include: {
            custom_fields: true,
            custom_field_entity_values: true,
          },
        },
      },
    });

    if (!company) throw new NotFoundException('Company not found');

    return { success: true, company };
  }

  /**
   * Create a new company (potentially with a contact)
   */
  async createNew(workspaceId: bigint, userId: bigint, data: any) {
    let company;
    if (data.company_id) {
      company = await this.prisma.companies.findFirst({
        where: { id: BigInt(data.company_id), workspace_id: workspaceId },
      });
    } else {
      const companyName = data.company_name || data.contact_name;
      if (!companyName)
        throw new BadRequestException(
          'Company name or contact name is required',
        );

      company = await this.prisma.companies.create({
        data: {
          workspace_id: workspaceId,
          user_id: userId,
          name: companyName,
          status: 'ACTIVE',
        },
      });
    }

    let contact = null;
    if (data.contact_name) {
      const splitName = data.contact_name.split(' ', 2);
      const firstName = splitName[0];
      const lastName = splitName[1] || '';

      contact = await this.prisma.contacts.create({
        data: {
          workspace_id: workspaceId,
          first_name: firstName,
          last_name: lastName,
          full_name: data.contact_name,
          company_id: company.id,
          source: 'MANUAL',
          status: 'PENDING',
        },
      });
    }

    return { success: true, company, contact };
  }

  /**
   * Change company status (trash/untrash)
   */
  async changeStatus(workspaceId: bigint, companyId: bigint, action: string) {
    const company = await this.prisma.companies.findFirst({
      where: { id: companyId, workspace_id: workspaceId },
    });

    if (!company) throw new NotFoundException('Company not found');

    const deletedAt = action === 'TRASH' ? new Date() : null;

    await this.prisma.companies.update({
      where: { id: companyId },
      data: { deleted_at: deletedAt },
    });

    return { success: true };
  }

  /**
   * Update company details
   */
  async updateCompany(workspaceId: bigint, companyId: bigint, data: any) {
    const {
      name,
      description,
      url,
      industry,
      tax_id,
      gallery_media_id,
      status,
    } = data;

    const company = await this.prisma.companies.findFirst({
      where: { id: companyId, workspace_id: workspaceId },
    });

    if (!company) throw new NotFoundException('Company not found');

    const updated = await this.prisma.companies.update({
      where: { id: companyId },
      data: {
        name,
        description,
        url,
        industry,
        tax_id,
        gallery_media_id: gallery_media_id
          ? BigInt(gallery_media_id)
          : undefined,
        status: status || undefined,
      },
    });

    return { success: true, company: updated };
  }

  /**
   * Assign a contact to a company
   */
  async assignCompany(
    workspaceId: bigint,
    contactId: bigint,
    companyId: bigint,
  ) {
    const contact = await this.prisma.contacts.findFirst({
      where: { id: contactId, workspace_id: workspaceId },
    });

    if (!contact) throw new NotFoundException('Contact not found');

    const company = await this.prisma.companies.findFirst({
      where: { id: companyId, workspace_id: workspaceId },
    });

    if (!company) throw new NotFoundException('Company not found');

    await this.prisma.contacts.update({
      where: { id: contactId },
      data: { company_id: companyId },
    });

    return { success: true };
  }

  /**
   * Soft delete a company
   */
  async deleteCompany(workspaceId: bigint, companyId: bigint) {
    const company = await this.prisma.companies.findFirst({
      where: { id: companyId, workspace_id: workspaceId },
    });

    if (!company) throw new NotFoundException('Company not found');

    // Unlink contacts first
    await this.prisma.contacts.updateMany({
      where: { company_id: companyId },
      data: { company_id: null },
    });

    await this.prisma.companies.update({
      where: { id: companyId },
      data: { deleted_at: new Date() },
    });

    return { success: true };
  }
}
