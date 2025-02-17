import { Controller, Get, Post, Query, Sse } from '@nestjs/common';
import { ParseService } from './parse.service';
import { Observable } from 'rxjs';
import { EventService } from 'src/common/event.service';
import { EVENT_NAMES } from 'src/common/constants';
import { ParseLogService } from 'src/logs/parse-log.service';

@Controller('parse')
export class ParseController {
  constructor(
    private readonly parseService: ParseService,
    private readonly eventService: EventService,
    private readonly parseLogService: ParseLogService,
  ) {}

  /**
   * 특정 날짜의 로그 조회
   * @param date (YYYY-MM-DD)
   */
  @Get('logs')
  async getLogs(@Query('date') date: string) {
    if (!date) {
      return { message: '날짜를 YYYY-MM-DD 형식으로 입력하세요.' };
    }

    return await this.parseLogService.getLogsByDate(date);
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

    return await this.parseLogService.getParseStatusByDateRange(
      startDate,
      endDate,
    );
  }

  @Post('update')
  async startParsing() {
    await this.parseService.startParsing();
    return { message: 'Stock parsing started' };
  }

  @Sse('progress')
  progress(): Observable<MessageEvent> {
    return new Observable((observer) => {
      this.eventService
        .getEventStream(EVENT_NAMES.PROGRESS_PARSE)
        .subscribe((progressData) => {
          observer.next({ data: progressData } as MessageEvent);
        });
    });
  }
}
