import { Test, TestingModule } from '@nestjs/testing';
import { AiProductsService } from './ai-products.service';

describe('AiProductsService', () => {
  let service: AiProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiProductsService],
    }).compile();

    service = module.get<AiProductsService>(AiProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
