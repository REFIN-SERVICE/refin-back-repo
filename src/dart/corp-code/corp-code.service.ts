import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import AdmZip from 'adm-zip';
import * as xml2js from 'xml2js';

@Injectable()
export class CorpCodeService implements OnModuleInit {
  private readonly logger = new Logger(CorpCodeService.name);
  private corpCodeMap = new Map<string, string>(); // stock_code -> corp_code

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.loadCorpCodes();
  }

  private async loadCorpCodes() {
    this.logger.log('Loading corporate codes from DART...');
    const apiKey = this.configService.get<string>('DART_API_KEY');
    const url = `https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${apiKey}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { responseType: 'arraybuffer' }),
      );

      const zip = new AdmZip(Buffer.from(response.data));
      const zipEntries = zip.getEntries();
      const corpCodeEntry = zipEntries.find(
        (entry) => entry.entryName === 'CORPCODE.xml',
      );

      if (!corpCodeEntry) {
        throw new Error('CORPCODE.xml not found in the zip file');
      }

      const xmlData = corpCodeEntry.getData().toString('utf8');
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xmlData);

      const list = result.result.list;
      if (Array.isArray(list)) {
        list.forEach((item) => {
          if (item.stock_code && item.stock_code.trim() !== '') {
            this.corpCodeMap.set(item.stock_code, item.corp_code);
          }
        });
      }

      this.logger.log(`Successfully loaded ${this.corpCodeMap.size} corporate codes.`);
    } catch (error) {
      this.logger.error('Failed to load corporate codes:', error.message);
    }
  }

  getCorpCode(stockCode: string): string | undefined {
    return this.corpCodeMap.get(stockCode);
  }
}