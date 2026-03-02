import { Test, TestingModule } from '@nestjs/testing';
import { AiThemesService } from './ai-themes.service';

describe('AiThemesService', () => {
  let service: AiThemesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiThemesService],
    }).compile();

    service = module.get<AiThemesService>(AiThemesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
