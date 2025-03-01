import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PredictService } from './predict.service';
import { PredictionLogService } from 'src/log/prediction-log.service';
import { StartPredictDto } from 'src/dto/start-predict.dto';

@Controller('predict')
export class PredictController {
  constructor(
    private readonly predictService: PredictService,
    private readonly predictionLogService: PredictionLogService,
  ) {}

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

    return await this.predictionLogService.getPredictionStatusByDateRange(
      startDate,
      endDate,
    );
  }

  @Get('')
  async getPredictions(@Query('date') date: string) {
    if (!date) {
      return { message: '날짜를 YYYY-MM-DD 형식으로 입력하세요.' };
    }

    return await this.predictService.getPredictedDataByDate(date);
  }

  @Post('')
  async startPredicting(@Body() startPredictDto: StartPredictDto) {
    await this.predictService.startPredicting(startPredictDto);
    return { message: 'Stock predict started' };
  }
}
