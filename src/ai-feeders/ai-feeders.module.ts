import { Module } from '@nestjs/common';
import { AiFeedersController } from './ai-feeders.controller';
import { AiFeedersService } from './ai-feeders.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiFeedersController],
  providers: [AiFeedersService],
  exports: [AiFeedersService],
})
export class AiFeedersModule { }
