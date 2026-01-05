import { Controller, Get, Query } from '@nestjs/common';
import { DartService, DartApiResponse } from './dart.service';

@Controller('dart')
export class DartController {
  constructor(private readonly dartService: DartService) {}

  @Get('list')
  async getReportList(
    @Query('corp_code') corpCode: string,
    @Query('bgn_de') bgnDe: string,
    @Query('end_de') endDe: string,
    @Query('page_no') pageNo?: number,
    @Query('page_count') pageCount?: number,
  ): Promise<DartApiResponse> {
    return this.dartService.getReportList(
      corpCode,
      bgnDe,
      endDe,
      pageNo,
      pageCount,
    );
  }

  @Get('financial-statements')
  async getFinancialStatements(
    @Query('corp_code') corpCode: string,
    @Query('bsns_year') bsnsYear: string,
    @Query('reprt_code') reprtCode: string,
  ): Promise<DartApiResponse> {
    return this.dartService.getFinancialStatements(
      corpCode,
      bsnsYear,
      reprtCode,
    );
  }

  @Get('financial-statements/multi-year')
  async getMultiYearFinancialStatements(
    @Query('corp_code') corpCode: string,
    @Query('start_year') startYear: number,
    @Query('end_year') endYear: number,
    @Query('reprt_code') reprtCode: string,
  ): Promise<Record<string, any>> {
    return this.dartService.getMultiYearFinancialStatements(
      corpCode,
      Number(startYear),
      Number(endYear),
      reprtCode,
    );
  }

  @Get('indicators')
  async getCompanyIndicators(
    @Query('stock_code') stockCode: string,
    @Query('start_year') startYear: number,
    @Query('end_year') endYear: number,
  ) {
    return this.dartService.getCompanyIndicators(
      stockCode,
      Number(startYear),
      Number(endYear),
    );
  }
}
