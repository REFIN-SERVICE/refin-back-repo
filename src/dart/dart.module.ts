import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DartController } from './dart.controller';
import { DartService } from './dart.service';
import { CorpCodeService } from './corp-code/corp-code.service';

@Module({
  imports: [HttpModule],
  controllers: [DartController],
  providers: [DartService, CorpCodeService],
})
export class DartModule {}
