import { Test, TestingModule } from '@nestjs/testing';
import { SystemFieldsService } from './system-fields.service';

describe('SystemFieldsService', () => {
  let service: SystemFieldsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SystemFieldsService],
    }).compile();

    service = module.get<SystemFieldsService>(SystemFieldsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
