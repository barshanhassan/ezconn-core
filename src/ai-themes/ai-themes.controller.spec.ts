import { Test, TestingModule } from '@nestjs/testing';
import { AiThemesController } from './ai-themes.controller';

describe('AiThemesController', () => {
  let controller: AiThemesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiThemesController],
    }).compile();

    controller = module.get<AiThemesController>(AiThemesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
