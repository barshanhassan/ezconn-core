import { Test, TestingModule } from '@nestjs/testing';
import { DifyService } from './dify.service';

describe('DifyService', () => {
  let service: DifyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DifyService],
    }).compile();

    service = module.get<DifyService>(DifyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
