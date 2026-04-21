import { Module } from '@nestjs/common';
import { TextToSpeechController } from './text-to-speech.controller';
import { TextToSpeechService } from './text-to-speech.service';

@Module({
  controllers: [TextToSpeechController],
  providers: [TextToSpeechService],
})
export class TextToSpeechModule {}
