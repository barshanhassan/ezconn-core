import { Module } from '@nestjs/common';
import { AgencyController } from './agency.controller';
import { AgencyService } from './agency.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AgencyController],
  providers: [AgencyService],
  exports: [AgencyService],
})
export class AgencyModule { }
