import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { TextToSpeechService } from './text-to-speech.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('text-to-speech')
export class TextToSpeechController {
  constructor(private readonly textToSpeechService: TextToSpeechService) {}

  @Post()
  generateSpeech(@Request() req: any) {
    return { message: 'Generating speech from text', user: req.user };
  }

  @Post('save-tts')
  saveTTS(@Request() req: any) {
    return { message: 'Saving generated TTS', user: req.user };
  }

  @Post('voices')
  getVoices(@Request() req: any) {
    return { message: 'Fetching available voices', user: req.user };
  }

  @Post('get-voices-by-region')
  getVoicesByRegion(@Request() req: any) {
    return { message: 'Fetching voices by region', user: req.user };
  }
}
