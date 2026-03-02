import { Module } from '@nestjs/common';
import { QuickResponseController } from './quick-response.controller';
import { QuickResponseService } from './quick-response.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [QuickResponseController],
    providers: [QuickResponseService],
    exports: [QuickResponseService],
})
export class QuickResponseModule { }
