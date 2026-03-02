import { Module } from '@nestjs/common';
import { CalController } from './cal.controller';
import { BookingController } from './booking.controller';
import { CalService } from './cal.service';
import { BookingService } from './booking.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CalController, BookingController],
  providers: [CalService, BookingService],
  exports: [CalService, BookingService],
})
export class CalModule { }
