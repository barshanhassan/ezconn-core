import { Test, TestingModule } from '@nestjs/testing';
import { SystemFieldsController } from './system-fields.controller';

describe('SystemFieldsController', () => {
  let controller: SystemFieldsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemFieldsController],
    }).compile();

    controller = module.get<SystemFieldsController>(SystemFieldsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
