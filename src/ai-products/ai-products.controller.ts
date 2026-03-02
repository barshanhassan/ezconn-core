import { Controller, Get, Post, Patch, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { AiProductsService } from './ai-products.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ai-themes/:theme/ai-products')
export class AiProductsController {
    constructor(private readonly aiProductsService: AiProductsService) { }

    @Get()
    index(@Param('theme') theme: string, @Request() req: any) {
        return { message: `Listing products for theme ${theme}`, user: req.user };
    }

    @Post()
    store(@Param('theme') theme: string, @Request() req: any) {
        return { message: `Adding product to theme ${theme}`, user: req.user };
    }

    @Patch(':product')
    update(@Param('theme') theme: string, @Param('product') product: string, @Request() req: any) {
        return { message: `Updating product ${product} for theme ${theme}`, user: req.user };
    }

    @Delete(':product')
    destroy(@Param('theme') theme: string, @Param('product') product: string, @Request() req: any) {
        return { message: `Deleting product ${product} for theme ${theme}`, user: req.user };
    }
}
