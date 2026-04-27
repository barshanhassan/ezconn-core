import { Module } from '@nestjs/common';
import { AgencyController } from './agency.controller';
import { AgencyService } from './agency.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';
import { DomainsModule } from '../domains/domains.module';

@Module({
  imports: [PrismaModule, BillingModule, DomainsModule],
  controllers: [AgencyController],
  providers: [AgencyService],
  exports: [AgencyService],
})
export class AgencyModule {}
