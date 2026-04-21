import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly service: MarketplaceService) {}

  @Get('listing')
  async getListing(@Request() req: any) {
    // Use agency_id from user if available, fallback to workspace_id check if needed
    const agencyId = BigInt(req.user.agency_id || 1);
    return this.service.getListing(agencyId);
  }

  @Post('listing')
  async submitListing(@Body() body: any, @Request() req: any) {
    const agencyId = BigInt(req.user.agency_id || 1);
    return this.service.submitListing(agencyId, body);
  }

  @Get('search-partners')
  async searchPartners(@Query() query: any) {
    return this.service.searchPartners(query);
  }

  @Get('partner/:slug')
  async getPartner(@Param('slug') slug: string) {
    return this.service.getPartner(slug);
  }
}
