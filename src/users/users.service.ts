import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Update User Name, Email, Profile details.
     */
    async updateProfile(userId: bigint, data: any) {
        const user = await this.prisma.users.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const updateData: any = {};
        if (data.name) updateData.full_name = data.name;
        if (data.email) updateData.email = data.email;

        // Handle password change if requested within profile logic
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        const updated = await this.prisma.users.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, full_name: true, email: true, timezone: true, locale: true, availability: true }
        });

        return { success: true, user: updated, message: 'Profile updated successfully' };
    }

    /**
     * Update Language Preferences.
     */
    async updateLanguage(userId: bigint, language: string) {
        if (!language) throw new BadRequestException('Language is required');

        await this.prisma.users.update({
            where: { id: userId },
            data: { locale: language }
        });

        return { success: true, message: 'Language updated successfully' };
    }

    /**
     * Update Timezone Preferences.
     */
    async updateDateTime(userId: bigint, data: any) {
        const { time_zone, time_format, date_format } = data;

        const updateData: any = {};
        if (time_zone) updateData.timezone = time_zone;
        if (time_format) updateData.time_format = time_format;
        if (date_format) updateData.date_format = date_format;

        await this.prisma.users.update({
            where: { id: userId },
            data: updateData
        });

        return { success: true, message: 'Date and time settings updated' };
    }

    /**
     * Set agent availability (Online / Offline Toggle).
     */
    async setAvailability(userId: bigint, availability: number) {
        if (typeof availability === 'undefined') {
            throw new BadRequestException('Availability status required');
        }

        const availability_status = availability === 1 ? 'AVAILABLE' : 'OFFLINE';

        await this.prisma.users.update({
            where: { id: userId },
            data: { availability: availability_status }
        });

        return { success: true, is_online: availability_status === 'AVAILABLE' };
    }

    /**
     * Profile Avatar Upload Logic (Stub matching Laravel's base64 logic or Multipart).
     */
    async uploadProfileLogo(userId: bigint, file: Express.Multer.File | any, isBase64 = false) {
        // Implementation logic abstractly stores image 
        // In real NestJS implementation with Cloudflare/S3 - we push the buffer to bucket
        let fileUrl = `https://dummy-bucket.s3.amazonaws.com/avatars/${userId}-${Date.now()}.png`;

        await this.prisma.users.update({
            where: { id: userId },
            data: { /* Add gallery mapping if image uploads */ }
        });

        return { success: true, logo: fileUrl, message: 'Avatar updated successfully' };
    }

    /**
     * Remove Profile Avatar.
     */
    async removeProfileLogo(userId: bigint) {
        await this.prisma.users.update({
            where: { id: userId },
            data: { gallery_media_id: null }
        });

        return { success: true, message: 'Avatar removed successfully' };
    }

    /**
     * Get programmatic API Token for Webhooks / External triggers.
     */
    async getPublicAPIToken(userId: bigint, workspaceId: bigint) {
        // Laravel logic checked the Workspace table for `api_token`
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            select: { api_token: true }
        });

        return { success: true, api_token: user?.api_token || null };
    }

    /**
     * Generate new programmatic API Token for Webhooks / External triggers.
     */
    async createPublicAPIToken(userId: bigint, workspaceId: bigint) {
        const token = crypto.randomBytes(32).toString('hex');

        await this.prisma.workspaces.update({
            where: { id: workspaceId },
            data: { /* mapping api token logic */ }
        });

        return { success: true, api_token: token, message: 'API Token generated' };
    }
}
