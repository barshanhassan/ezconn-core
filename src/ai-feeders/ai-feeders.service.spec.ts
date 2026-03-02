import { Test, TestingModule } from '@nestjs/testing';
import { AiFeedersService } from './ai-feeders.service';

describe('AiFeedersService', () => {
  let service: AiFeedersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiFeedersService],
    }).compile();

    service = module.get<AiFeedersService>(AiFeedersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
