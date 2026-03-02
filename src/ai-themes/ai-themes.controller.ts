import { Controller, Get, Post, Patch, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { AiThemesService } from './ai-themes.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ai-themes')
export class AiThemesController {
    constructor(private readonly aiThemesService: AiThemesService) { }

    @Get()
    index(@Request() req: any) {
        return { message: 'Listing all AI themes', user: req.user };
    }

    @Get(':type')
    indexWithType(@Param('type') type: string, @Request() req: any) {
        return { message: `Listing AI themes of type ${type}`, user: req.user };
    }

    @Get(':theme/show')
    show(@Param('theme') theme: string, @Request() req: any) {
        return { message: `Showing AI theme ${theme}`, user: req.user };
    }

    @Post()
    store(@Request() req: any) {
        return { message: 'Creating new AI theme', user: req.user };
    }

    @Patch(':theme')
    update(@Param('theme') theme: string, @Request() req: any) {
        return { message: `Updating AI theme ${theme}`, user: req.user };
    }

    @Delete(':theme')
    destroy(@Param('theme') theme: string, @Request() req: any) {
        return { message: `Deleting AI theme ${theme}`, user: req.user };
    }
}
