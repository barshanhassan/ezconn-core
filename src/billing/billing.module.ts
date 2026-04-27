import { Module, Global } from '@nestjs/common';
import { ChargebeeService } from './chargebee.service';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { BillingSyncHelper } from './helpers/billing-sync.helper';

@Global()
@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [BillingController],
  providers: [ChargebeeService, BillingService, BillingSyncHelper],
  exports: [ChargebeeService, BillingService],
})
export class BillingModule {}
