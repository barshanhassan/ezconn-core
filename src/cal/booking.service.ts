// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalService } from './cal.service';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  private readonly calApiUrl = 'https://api.cal.com/';

  constructor(
    private readonly prisma: PrismaService,
    private readonly calService: CalService,
  ) {}

  /**
   * Get bookings for a workspace
   */
  async getBookings(workspaceId: bigint, query: any) {
    const { contact_id, status } = query;
    const where: any = { workspace_id: workspaceId };
    if (contact_id) where.contact_id = BigInt(contact_id);
    if (status) where.status = status;

    return this.prisma.bookings.findMany({
      where,
      include: {
        contacts: true,
      },
      orderBy: { start: 'desc' },
    });
  }

  /**
   * Create a new booking (Integrates with Cal.com)
   */
  async createBooking(workspaceId: bigint, userId: bigint, data: any) {
    const {
      event_type_id,
      start,
      timezone,
      responses,
      contact_id,
      account_id,
    } = data;
    const account = await this.calService.getAccount(
      workspaceId,
      account_id ? BigInt(account_id) : undefined,
    );

    if (!account || !account.api_key) {
      throw new BadRequestException(
        'Cal.com account not found or API key missing',
      );
    }

    let calResponse;
    try {
      if (account.version === 'v2') {
        const payload = {
          eventTypeId: parseInt(event_type_id),
          start: new Date(start).toISOString(),
          attendee: {
            name: responses.name,
            email: responses.email,
            timeZone: timezone || 'UTC',
          },
        };
        const res = await fetch(`${this.calApiUrl}v2/bookings`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${account.api_key}`,
            'Content-Type': 'application/json',
            'cal-api-version': '2024-08-13',
          },
          body: JSON.stringify(payload),
        });
        calResponse = await res.json();
        calResponse =
          calResponse.status === 'success' ? calResponse.data : null;
      } else {
        const payload = {
          eventTypeId: parseInt(event_type_id),
          start: new Date(start).toISOString(),
          responses: responses,
          timeZone: timezone || 'UTC',
        };
        const res = await fetch(
          `${this.calApiUrl}v1/bookings?apiKey=${account.api_key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
        );
        calResponse = await res.json();
      }
    } catch (e) {
      this.logger.error(`Cal.com booking failed: ${e.message}`);
      throw new BadRequestException('Failed to create booking on Cal.com');
    }

    if (!calResponse)
      throw new BadRequestException('Booking API returned empty response');

    // Save to DB
    const booking = await this.prisma.bookings.create({
      data: {
        workspace_id: workspaceId,
        contact_id: contact_id ? BigInt(contact_id) : null,
        uid: calResponse.uid || calResponse.id?.toString(),
        title: responses.title || 'Meeting',
        description: responses.notes || '',
        status: 'ACTIVE',
        start: new Date(start),
        end: calResponse.end ? new Date(calResponse.end) : null,
        booking_data: JSON.stringify(calResponse),
      },
    });

    return { success: true, booking };
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(workspaceId: bigint, bookingId: bigint) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId, workspace_id: workspaceId },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const account = await this.calService.getAccount(workspaceId);
    if (account && account.api_key) {
      try {
        if (account.version === 'v2') {
          await fetch(`${this.calApiUrl}v2/bookings/${booking.uid}/cancel`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${account.api_key}`,
              'cal-api-version': '2024-08-13',
            },
            body: JSON.stringify({ cancellationReason: 'Cancelled by Host' }),
          });
        } else {
          await fetch(
            `${this.calApiUrl}v1/bookings/${booking.uid}/cancel?apiKey=${account.api_key}`,
            {
              method: 'DELETE',
            },
          );
        }
      } catch (e) {
        this.logger.warn(
          `Failed to cancel booking on Cal.com side: ${e.message}`,
        );
      }
    }

    await this.prisma.bookings.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });

    return { success: true };
  }
}
