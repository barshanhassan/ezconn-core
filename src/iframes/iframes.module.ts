import { Module } from '@nestjs/common';
import { IframesController } from './iframes.controller';
import { IframesService } from './iframes.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [IframesController],
  providers: [IframesService, PrismaService],
})
export class IframesModule {}
