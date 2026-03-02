import { Module } from '@nestjs/common';
import { BaserowController } from './baserow.controller';
import { BaserowService } from './baserow.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BaserowController],
  providers: [BaserowService],
  exports: [BaserowService],
})
export class BaserowModule { }
