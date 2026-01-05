import { Test, TestingModule } from '@nestjs/testing';
import { CorpCodeService } from './corp-code.service';

describe('CorpCodeService', () => {
  let service: CorpCodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorpCodeService],
    }).compile();

    service = module.get<CorpCodeService>(CorpCodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
