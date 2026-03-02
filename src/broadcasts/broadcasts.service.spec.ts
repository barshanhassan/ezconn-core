import { Test, TestingModule } from '@nestjs/testing';
import { BroadcastsService } from './broadcasts.service';

describe('BroadcastsService', () => {
  let service: BroadcastsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BroadcastsService],
    }).compile();

    service = module.get<BroadcastsService>(BroadcastsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
