import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

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
      select: {
        id: true,
        full_name: true,
        email: true,
        timezone: true,
        locale: true,
        availability: true,
      },
    });

    return {
      success: true,
      user: updated,
      message: 'Profile updated successfully',
    };
  }

  /**
   * Update Language Preferences.
   */
  async updateLanguage(userId: bigint, language: string) {
    if (!language) throw new BadRequestException('Language is required');

    await this.prisma.users.update({
      where: { id: userId },
      data: { locale: language },
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
      data: updateData,
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
      data: { availability: availability_status },
    });

    return { success: true, is_online: availability_status === 'AVAILABLE' };
  }

  /**
   * Profile Avatar Upload Logic (Stub matching Laravel's base64 logic or Multipart).
   */
  async uploadProfileLogo(
    userId: bigint,
    file: Express.Multer.File | any,
    isBase64 = false,
  ) {
    // Implementation logic abstractly stores image
    // In real NestJS implementation with Cloudflare/S3 - we push the buffer to bucket
    const fileUrl = `https://dummy-bucket.s3.amazonaws.com/avatars/${userId}-${Date.now()}.png`;

    await this.prisma.users.update({
      where: { id: userId },
      data: {
        /* Add gallery mapping if image uploads */
      },
    });

    return {
      success: true,
      logo: fileUrl,
      message: 'Avatar updated successfully',
    };
  }

  /**
   * Remove Profile Avatar.
   */
  async removeProfileLogo(userId: bigint) {
    await this.prisma.users.update({
      where: { id: userId },
      data: { gallery_media_id: null },
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
      select: { api_token: true },
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
      data: {
        /* mapping api token logic */
      },
    });

    return { success: true, api_token: token, message: 'API Token generated' };
  }

  /**
   * Get UI Theme preferences from User States.
   */
  async getTheme(userId: bigint) {
    const state = await this.prisma.user_states.findFirst({
      where: { user_id: userId, type: 'THEME' },
    });
    if (!state) return { mode: 'light', primaryColor: '217 91% 60%' };
    try {
      return JSON.parse(state.data);
    } catch (e) {
      return { mode: 'light', primaryColor: '217 91% 60%' };
    }
  }

  /**
   * Update UI Theme preferences in User States.
   */
  async updateTheme(userId: bigint, data: any) {
    const { mode, primaryColor } = data;
    const existing = await this.prisma.user_states.findFirst({
      where: { user_id: userId, type: 'THEME' },
    });

    const themeData = JSON.stringify({ mode, primaryColor });

    if (existing) {
      await this.prisma.user_states.update({
        where: { id: existing.id },
        data: { data: themeData },
      });
    } else {
      await this.prisma.user_states.create({
        data: {
          user_id: userId,
          type: 'THEME',
          data: themeData,
        },
      });
    }

    return { success: true, message: 'Theme updated successfully' };
  }

  /**
   * Dedicated Change Password Logic
   * Verifies current password before updating to new hashed password
   */
  async changePassword(userId: bigint, data: any) {
    const { currentPassword, newPassword } = data;

    if (!currentPassword || !newPassword) {
      throw new BadRequestException('Current and new password are required');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    // Verification - Note: In some systems, password might be empty if using SSO / Social Login
    const isMatched = await bcrypt.compare(currentPassword, user.password || '');
    if (!isMatched) {
      throw new BadRequestException('Current password does not match');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true, message: 'Password updated successfully' };
  }
}
