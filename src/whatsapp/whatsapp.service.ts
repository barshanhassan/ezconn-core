import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WhatsappService {
  constructor(private readonly prisma: PrismaService) {}

  async getWhatsAppAccount(workspaceId: bigint) {
    const account = await this.prisma.wa_accounts.findFirst({
      where: { workspace_id: workspaceId },
    });


    if (!account) return null;

    const phoneNumber = await this.prisma.wa_phone_numbers.findFirst({
      where: { wa_account_id: account.id }
    });

    return {
      account,
      phoneNumber
    };
  }

  async updateBusinessProfile(workspaceId: bigint, data: any) {
    const account = await this.prisma.wa_accounts.findFirst({
      where: { workspace_id: workspaceId }
    });

    if (!account) throw new NotFoundException('WhatsApp account not found');

    const phoneNumber = await this.prisma.wa_phone_numbers.findFirst({
      where: { wa_account_id: account.id }
    });

    if (!phoneNumber) throw new NotFoundException('WhatsApp phone number not found');

    return this.prisma.wa_phone_numbers.update({
      where: { id: phoneNumber.id },
      data: {
        verified_name: data.displayName,
        // Other fields like category, description, address, about, email, website 
        // are likely stored in a different table or as JSON in throughput/smb_app_data?
        // In many WhatsApp implementations, these are part of a 'profile' object.
        // For now, let's just update verified_name.
      }
    });
  }
}
