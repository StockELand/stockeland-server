import { Controller, Get, Post, Query } from '@nestjs/common';
import { PredictService } from './predict.service';
import { PredictLogService } from 'src/log/predict-log.service';

@Controller('predict')
export class PredictController {
  constructor(
    private readonly predictService: PredictService,
    private readonly predictionLogService: PredictLogService,
  ) {}

  @Get('')
  async getPredictedDataByDate(@Query('date') date: string) {
    if (!date) {
      return { message: '날짜를 YYYY-MM-DD 형식으로 입력하세요.' };
    }

    return await this.predictService.getPredictedDataByDate(date);
  }

  /**
   * 특정 날짜의 로그 조회
   * @param date (YYYY-MM-DD)
   */
  @Get('logs')
  async getLogs(@Query('date') date: string) {
    if (!date) {
      return { message: '날짜를 YYYY-MM-DD 형식으로 입력하세요.' };
    }

    return await this.predictionLogService.getLogsByDate(date);
  }

  @Get('status')
  async getParseStatus(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      return {
        message: 'startDate와 endDate를 YYYY-MM-DD 형식으로 입력하세요.',
      };
    }

    return await this.predictionLogService.getPredictStatusByDateRange(
      startDate,
      endDate,
    );
  }

  @Post('update')
  async startParsing() {
    await this.predictService.startLearning();
    return { message: 'Stock parsing started' };
  }
}
