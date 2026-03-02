import { Module } from '@nestjs/common';
import { AiThemesController } from './ai-themes.controller';
import { AiThemesService } from './ai-themes.service';

@Module({
  controllers: [AiThemesController],
  providers: [AiThemesService]
})
export class AiThemesModule {}
