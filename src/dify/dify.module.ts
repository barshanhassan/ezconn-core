import { Module } from '@nestjs/common';
import { DifyController } from './dify.controller';
import { DifyService } from './dify.service';

@Module({
  controllers: [DifyController],
  providers: [DifyService]
})
export class DifyModule {}
