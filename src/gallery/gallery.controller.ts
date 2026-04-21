import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  UseGuards,
  Request,
  Param,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GalleryService } from './gallery.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('gallery')
export class GalleryController {
  constructor(private readonly service: GalleryService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFile(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
    @Request() req: any,
  ) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    const userId = BigInt(req.user.id || req.user.sub || 1);
    const modelableId = BigInt(req.user.modelable_id || 1);
    const modelableType = req.user.modelable_type || 'App\\Models\\Agency';
    return this.service.uploadFiles(
      files,
      body.parent_id,
      workspaceId,
      userId,
      modelableId,
      modelableType,
    );
  }

  @Post('folder')
  async createFolder(@Body() body: any, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    const userId = BigInt(req.user.id || req.user.sub || 1);
    const modelableId = BigInt(req.user.modelable_id || 1);
    const modelableType = req.user.modelable_type || 'App\\Models\\Agency';
    return this.service.createFolder(
      body.name,
      workspaceId,
      userId,
      modelableId,
      modelableType,
      body.parent_id,
    );
  }

  @Get('listings')
  async getMediaListings(@Query() query: any, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    const userId = BigInt(req.user.sub || 1);
    const roleSlug = req.user.role || 'member';
    return this.service.getMediaListings(workspaceId, userId, roleSlug, query);
  }

  @Patch('rename/:id')
  async renameObject(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    const userId = BigInt(req.user.sub || 1);
    return this.service.renameObject(id, body.object_name, workspaceId, userId);
  }

  @Delete('media/:id')
  async deleteMedia(@Param('id') id: string, @Request() req: any) {
    const workspaceId = BigInt(req.user.workspace_id || 1);
    const userId = BigInt(req.user.sub || 1);
    return this.service.deleteMedia(id, workspaceId, userId);
  }
}
