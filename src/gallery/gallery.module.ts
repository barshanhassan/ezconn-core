import { Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';

import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [GalleryController],
  providers: [GalleryService]
})
export class GalleryModule { }
