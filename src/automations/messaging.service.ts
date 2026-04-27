import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sendWhatsApp(contactId: bigint, properties: any, workspaceId: bigint) {
    const message = properties.message || properties.body || '';
    const waNumberId = properties.wa_number_id ? BigInt(properties.wa_number_id) : undefined;
    
    // Find or create chat
    let chat = await this.prisma.wa_chats.findFirst({
      where: { contact_id: contactId }
    });

    if (!chat) {
        // Fallback or create logic if needed, for now we assume it exists or we use a stub
        return false;
    }

    await this.prisma.wa_messages.create({
      data: {
        wa_chat_id: chat.id,
        wa_number_id: waNumberId || 0n, // Handle mandatory fields
        mobile_number: '', // Should come from contact
        text: message,
        status: 'sent',
        direction: 'OUTGOING',
        type: 'text',
        communication_mode: 'AUTOMATION'
      }
    });

    return true;
  }

  async sendTelegram(contactId: bigint, properties: any, workspaceId: bigint) {
    const message = properties.message || properties.body || '';
    const botId = properties.telegram_bot_id ? BigInt(properties.telegram_bot_id) : undefined;
    
    let chat = await this.prisma.telegram_chats.findFirst({
      where: { contact_id: contactId, workspace_id: workspaceId }
    });

    if (!chat) return false;

    await this.prisma.telegram_messages.create({
      data: {
        telegram_chat_id: chat.id,
        message_number: 0n, // Required
        message_id: 'auto_' + Date.now(), // Required
        seen: true,
        data: '{}', // Required
        text: message,
        status: 'SENT',
        direction: 'OUTGOING',
        type: 'text',
        communication_mode: 'AUTOMATION'
      }
    });

    return true;
  }

  async sendSms(contactId: bigint, properties: any, workspaceId: bigint) {
    this.logger.log(`Sending SMS to contact ${contactId}`);
    return { success: true, messageId: 'sms_mock_' + Date.now() };
  }

  async sendEmail(contactId: bigint, properties: any, workspaceId: bigint) {
    this.logger.log(`Sending Email to contact ${contactId}`);
    return { success: true, messageId: 'email_mock_' + Date.now() };
  }
}
