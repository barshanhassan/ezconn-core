import { Test, TestingModule } from '@nestjs/testing';
import { CalService } from './cal.service';

describe('CalService', () => {
  let service: CalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalService],
    }).compile();

    service = module.get<CalService>(CalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
