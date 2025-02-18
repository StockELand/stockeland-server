import { Controller, Get, Post, Query, Sse } from '@nestjs/common';
import { PredictService } from './predict.service';
import { Observable } from 'rxjs';
import { EventService } from 'src/common/event.service';
import { EVENT_NAMES } from 'src/common/constants';
import { PredictionLogService } from 'src/log/predictions-log.service';

@Controller('predict')
export class PredictController {
  constructor(
    private readonly predictService: PredictService,
    private readonly eventService: EventService,
    private readonly predictionLogService: PredictionLogService,
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

    return await this.predictionLogService.getParseStatusByDateRange(
      startDate,
      endDate,
    );
  }

  @Post('update')
  async startParsing() {
    await this.predictService.startLearning();
    return { message: 'Stock parsing started' };
  }

  @Sse('progress')
  progress(): Observable<MessageEvent> {
    return new Observable((observer) => {
      this.eventService
        .getEventStream(EVENT_NAMES.PROGRESS_PREDICT)
        .subscribe((progressData) => {
          observer.next({ data: progressData } as MessageEvent);
        });
    });
  }
}
