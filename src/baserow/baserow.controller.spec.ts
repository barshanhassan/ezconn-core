import { Test, TestingModule } from '@nestjs/testing';
import { BaserowController } from './baserow.controller';

describe('BaserowController', () => {
  let controller: BaserowController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BaserowController],
    }).compile();

    controller = module.get<BaserowController>(BaserowController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
