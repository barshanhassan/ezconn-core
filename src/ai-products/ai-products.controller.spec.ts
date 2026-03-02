import { Test, TestingModule } from '@nestjs/testing';
import { AiProductsController } from './ai-products.controller';

describe('AiProductsController', () => {
  let controller: AiProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiProductsController],
    }).compile();

    controller = module.get<AiProductsController>(AiProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
