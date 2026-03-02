import { Test, TestingModule } from '@nestjs/testing';
import { ChatStatisticsService } from './chat-statistics.service';

describe('ChatStatisticsService', () => {
  let service: ChatStatisticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatStatisticsService],
    }).compile();

    service = module.get<ChatStatisticsService>(ChatStatisticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
