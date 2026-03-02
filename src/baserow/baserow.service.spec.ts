import { Test, TestingModule } from '@nestjs/testing';
import { BaserowService } from './baserow.service';

describe('BaserowService', () => {
  let service: BaserowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BaserowService],
    }).compile();

    service = module.get<BaserowService>(BaserowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
