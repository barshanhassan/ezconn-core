import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { BundlesService } from './bundles.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('bundles')
export class BundlesController {
    constructor(private readonly service: BundlesService) { }

    @Post()
    async createBundle(@Body() body: any, @Request() req: any) {
        return this.service.createBundle(body, req.user.workspace_id || 1, BigInt(req.user.sub));
    }

    @Patch(':id')
    async updateBundle(@Param('id') id: string, @Body() body: any, @Request() req: any) {
        return this.service.updateBundle(BigInt(id), body, req.user.workspace_id || 1);
    }

    @Get()
    async getList(@Request() req: any) {
        return this.service.getList(req.user.workspace_id || 1);
    }

    @Get(':id')
    async getBundle(@Param('id') id: string, @Request() req: any) {
        return this.service.getBundle(BigInt(id), req.user.workspace_id || 1);
    }

    @Delete(':id')
    async deleteBundle(@Param('id') id: string, @Request() req: any) {
        return this.service.deleteBundle(BigInt(id), req.user.workspace_id || 1);
    }

    @Post(':id/share')
    async shareBundle(@Param('id') id: string, @Body() body: any, @Request() req: any) {
        return this.service.shareBundle(BigInt(id), req.user.workspace_id || 1, body);
    }

    @Delete('share/:share_id')
    async deleteBundleSharing(@Param('share_id') shareId: string, @Request() req: any) {
        return this.service.deleteBundleSharing(BigInt(shareId), req.user.workspace_id || 1);
    }

    @Post(':id/resources')
    async addResource(@Param('id') id: string, @Body() body: any) {
        return this.service.addResource(BigInt(id), body);
    }

    @Post(':id/resources/bulk')
    async bulkAddResources(@Param('id') id: string, @Body('resources') resources: any[]) {
        return this.service.bulkAddResources(BigInt(id), resources);
    }

    @Get('verify/:slug')
    async verifyBundle(@Param('slug') slug: string) {
        return this.service.verifyBundle(slug);
    }

    @Post('share/:share_id/verify')
    async verifyPasscode(@Param('share_id') shareId: string, @Body('pass_code') passcode: string) {
        return this.service.verifyPasscode(BigInt(shareId), passcode ?? '');
    }

    @Post('share/:share_id/import')
    async import(@Param('share_id') shareId: string, @Request() req: any) {
        return this.service.import(BigInt(shareId), req.user.workspace_id || 1);
    }
}
