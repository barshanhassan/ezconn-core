import { Controller, Get, Post, Delete, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
import { BookingService } from './booking.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingController {
    constructor(private readonly service: BookingService) { }

    @Get()
    async getBookings(@Query() query: any, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.getBookings(workspaceId, query);
    }

    @Post()
    async createBooking(@Body() body: any, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        const userId = BigInt(req.user.sub || 1);
        return this.service.createBooking(workspaceId, userId, body);
    }

    @Delete(':id')
    async cancelBooking(@Param('id') id: string, @Request() req: any) {
        const workspaceId = BigInt(req.user.workspace_id || 1);
        return this.service.cancelBooking(workspaceId, BigInt(id));
    }
}
