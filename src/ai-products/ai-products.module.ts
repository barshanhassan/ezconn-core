import { Module } from '@nestjs/common';
import { AiProductsController } from './ai-products.controller';
import { AiProductsService } from './ai-products.service';

@Module({
  controllers: [AiProductsController],
  providers: [AiProductsService],
})
export class AiProductsModule {}
