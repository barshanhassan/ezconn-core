import { Module } from '@nestjs/common';
import { ZapiService } from './zapi.service';
import { ZapiController } from './zapi.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [ZapiController],
  providers: [ZapiService],
})
export class ZapiModule {}
