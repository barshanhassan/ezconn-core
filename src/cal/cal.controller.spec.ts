import { Test, TestingModule } from '@nestjs/testing';
import { CalController } from './cal.controller';

describe('CalController', () => {
  let controller: CalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalController],
    }).compile();

    controller = module.get<CalController>(CalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
