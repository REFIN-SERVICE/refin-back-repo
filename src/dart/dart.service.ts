/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CorpCodeService } from './corp-code/corp-code.service';

export interface DartApiResponse {
  status: string;
  message: string;
  list?: any[];
  [key: string]: any;
}

@Injectable()
export class DartService {
  private readonly baseUrl = 'https://opendart.fss.or.kr/api';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly corpCodeService: CorpCodeService,
  ) {}

  async getReportList(
    corpCode: string,
    bgnDe: string,
    endDe: string,
    pageNo: number = 1,
    pageCount: number = 10,
  ): Promise<DartApiResponse> {
    const apiKey = this.configService.get<string>('DART_API_KEY');
    const url = `${this.baseUrl}/list.json`;

    const params = {
      crtfc_key: apiKey,
      corp_code: corpCode,
      bgn_de: bgnDe,
      end_de: endDe,
      last_reprt_at: 'N',
      pblntf_ty: 'A',
      corp_cls: 'Y',
      page_no: pageNo,
      page_count: pageCount,
    };

    const response = await firstValueFrom(
      this.httpService.get(url, { params }),
    );
    return response.data;
  }

  async getFinancialStatements(
    corpCode: string,
    bsnsYear: string,
    reprtCode: string,
  ): Promise<DartApiResponse> {
    const apiKey = this.configService.get<string>('DART_API_KEY');
    const url = `${this.baseUrl}/fnlttSinglAcnt.json`;

    const params = {
      crtfc_key: apiKey,
      corp_code: corpCode,
      bsns_year: bsnsYear,
      reprt_code: reprtCode,
    };

    const response = await firstValueFrom(
      this.httpService.get(url, { params }),
    );
    return response.data;
  }

  async getMultiYearFinancialStatements(
    corpCode: string,
    startYear: number,
    endYear: number,
    reprtCode: string,
  ): Promise<Record<string, any>> {
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) =>
      (startYear + i).toString(),
    );

    const promises = years.map((year) =>
      this.getFinancialStatements(corpCode, year, reprtCode),
    );

    const results = await Promise.all(promises);

    return results.reduce<Record<string, any>>((acc, current, index) => {
      acc[years[index]] = current.list || current.message;
      return acc;
    }, {});
  }

  async getCompanyIndicators(
    stockCode: string,
    startYear: number,
    endYear: number,
  ) {
    const corpCode = this.corpCodeService.getCorpCode(stockCode);
    if (!corpCode) {
      throw new Error(`Company with stock code ${stockCode} not found.`);
    }

    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) =>
      (startYear + i).toString(),
    );

    const targetIndicators = [
      '매출액증가율',
      '영업이익증가율',
      '자기자본이익률(ROE)',
      '부채비율',
      '유동비율',
      '매출액영업이익률',
    ];

    const results: Record<string, any> = {};

    // 증가율 계산을 위해 startYear - 1 부터 데이터를 가져옴
    const yearsToFetch = Array.from(
      { length: endYear - startYear + 2 },
      (_, i) => (startYear - 1 + i).toString(),
    );

    const accountsMap: Record<string, any> = {};

    // 1. 모든 연도의 재무제표 데이터 수집
    for (const year of yearsToFetch) {
      try {
        const data = await this.getFinancialStatements(corpCode, year, '1101'); // 사업보고서 기준
        if (data.list) {
          accountsMap[year] = data.list;
        }
      } catch (e) {
        console.error(`Failed to fetch data for ${year}`, e);
      }
    }

    // 2. 지표 계산
    const calculationYears = Array.from(
      { length: endYear - startYear + 1 },
      (_, i) => (startYear + i).toString(),
    );

    for (const year of calculationYears) {
      const currentData = accountsMap[year];
      const prevData = accountsMap[(Number(year) - 1).toString()];
      const indicators = {
        '매출액증가율': '0',
        '영업이익증가율': '0',
        '자기자본이익률(ROE)': '0',
        '부채비율': '0',
        '유동비율': '0',
        '매출액영업이익률': '0',
      };

      if (currentData) {
        const getValue = (list: any[], accountNm: string) => {
          // 1. 정확히 일치하는 항목 찾기 (연결재무제표 우선)
          let item = list.find(
            (i) =>
              i.account_nm === accountNm &&
              (i.fs_div === 'CFS' || i.fs_div === 'OFS'),
          );

          // 2. 정확히 일치하는 게 없으면 포함하는 항목 찾기
          if (!item) {
            item = list.find(
              (i) =>
                i.account_nm.includes(accountNm) &&
                (i.fs_div === 'CFS' || i.fs_div === 'OFS'),
            );
          }

          if (item && item.thstrm_amount) {
            const amountStr = item.thstrm_amount.toString().replace(/,/g, '');
            return parseFloat(amountStr) || 0;
          }
          return 0;
        };

        const currentRevenue = getValue(currentData, '매출액');
        const currentOperatingProfit = getValue(currentData, '영업이익');
        const currentNetIncome = getValue(currentData, '당기순이익') || getValue(currentData, '순이익');
        const currentEquity = getValue(currentData, '자본총계');
        const currentLiabilities = getValue(currentData, '부채총계');
        const currentCurrentAssets = getValue(currentData, '유동자산');
        const currentCurrentLiabilities = getValue(currentData, '유동부채');
        const currentAssets = getValue(currentData, '자산총계');

        // ROE
        if (currentEquity !== 0) {
          indicators['자기자본이익률(ROE)'] = ((currentNetIncome / currentEquity) * 100).toFixed(2);
        }

        // 부채비율
        if (currentEquity !== 0) {
          indicators['부채비율'] = ((currentLiabilities / currentEquity) * 100).toFixed(2);
        }

        // 유동비율
        if (currentCurrentLiabilities !== 0) {
          indicators['유동비율'] = ((currentCurrentAssets / currentCurrentLiabilities) * 100).toFixed(2);
        }

        // 매출액영업이익률
        if (currentRevenue !== 0) {
          indicators['매출액영업이익률'] = ((currentOperatingProfit / currentRevenue) * 100).toFixed(2);
        }

        // 증가율 (전년 데이터 필요)
        if (prevData) {
          const prevRevenue = getValue(prevData, '매출액');
          const prevOperatingProfit = getValue(prevData, '영업이익');

          if (prevRevenue !== 0) {
            indicators['매출액증가율'] = (((currentRevenue - prevRevenue) / Math.abs(prevRevenue)) * 100).toFixed(2);
          }
          if (prevOperatingProfit !== 0) {
            indicators['영업이익증가율'] = (((currentOperatingProfit - prevOperatingProfit) / Math.abs(prevOperatingProfit)) * 100).toFixed(2);
          }
        }

        // 원본 데이터 추가 (단위: 원)
        results[year] = {
          ...indicators,
          raw_data: {
            revenue: currentRevenue,
            operating_profit: currentOperatingProfit,
            net_income: currentNetIncome,
            total_assets: currentAssets || (currentEquity + currentLiabilities), // 자산총계 우선
            total_equity: currentEquity,
            total_liabilities: currentLiabilities,
          }
        };
      } else {
        results[year] = indicators; // 데이터가 없을 경우 지표만 0으로 반환
      }
    }

    return results;
  }
}
