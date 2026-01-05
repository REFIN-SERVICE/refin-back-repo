import { Test, TestingModule } from '@nestjs/testing';
import { DartService } from './dart.service';

describe('DartService', () => {
  let service: DartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DartService],
    }).compile();

    service = module.get<DartService>(DartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
