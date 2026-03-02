import { Test, TestingModule } from '@nestjs/testing';
import { DifyController } from './dify.controller';

describe('DifyController', () => {
  let controller: DifyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DifyController],
    }).compile();

    controller = module.get<DifyController>(DifyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
