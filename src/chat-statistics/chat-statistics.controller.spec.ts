import { Test, TestingModule } from '@nestjs/testing';
import { ChatStatisticsController } from './chat-statistics.controller';

describe('ChatStatisticsController', () => {
  let controller: ChatStatisticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatStatisticsController],
    }).compile();

    controller = module.get<ChatStatisticsController>(ChatStatisticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
