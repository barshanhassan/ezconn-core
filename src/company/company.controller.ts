import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompanyController {
  constructor(private readonly service: CompanyService) {}

  @Get() async getCompanies(@Request() req: any, @Query() filters: any) {
    return this.service.getCompanies(
      BigInt(req.user.workspace_id || 1),
      filters,
    );
  }
  @Post() async createNew(@Body() body: any, @Request() req: any) {
    return this.service.createNew(
      body,
      BigInt(req.user.workspace_id || 1),
      BigInt(req.user.sub),
    );
  }
  @Get(':id') async getProfile(@Param('id') id: string, @Request() req: any) {
    return this.service.getProfile(
      BigInt(id),
      BigInt(req.user.workspace_id || 1),
    );
  }
  @Patch(':id') async updateCompany(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.service.updateCompany(
      BigInt(id),
      body,
      BigInt(req.user.workspace_id || 1),
    );
  }
  @Post(':id/assign') async assignCompany(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.service.assignCompany(BigInt(id), body);
  }
  @Delete('field') async deleteCompanyField(@Body() body: any) {
    return this.service.deleteCompanyField(body);
  }
  @Patch('status') async changeStatus(@Body() body: any) {
    return this.service.changeStatus(body);
  }
  @Delete(':id') async deleteCompany(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.service.deleteCompany(
      BigInt(id),
      BigInt(req.user.workspace_id || 1),
    );
  }
  @Post('switch') async switchCompany(@Body() body: any) {
    return this.service.switchCompany(body);
  }
  @Post('assigned-agent') async assignedAgent(
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.service.assignedAgent(body, BigInt(req.user.workspace_id || 1));
  }
}
