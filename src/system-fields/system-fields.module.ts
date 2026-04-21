import { Module } from '@nestjs/common';
import { SystemFieldsController } from './system-fields.controller';
import { SystemFieldsService } from './system-fields.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SystemFieldsController],
  providers: [SystemFieldsService],
  exports: [SystemFieldsService],
})
export class SystemFieldsModule {}
