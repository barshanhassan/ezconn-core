import { Module } from '@nestjs/common';
import { WabaController } from './waba.controller';
import { WabaService } from './waba.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WabaController],
  providers: [WabaService],
  exports: [WabaService],
})
export class WabaModule {}
