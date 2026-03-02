import { Test, TestingModule } from '@nestjs/testing';
import { AiFeedersController } from './ai-feeders.controller';

describe('AiFeedersController', () => {
  let controller: AiFeedersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiFeedersController],
    }).compile();

    controller = module.get<AiFeedersController>(AiFeedersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
