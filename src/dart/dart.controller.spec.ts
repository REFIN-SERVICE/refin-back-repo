import { Test, TestingModule } from '@nestjs/testing';
import { DartController } from './dart.controller';

describe('DartController', () => {
  let controller: DartController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DartController],
    }).compile();

    controller = module.get<DartController>(DartController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
