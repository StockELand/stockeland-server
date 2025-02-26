import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { StockService } from 'src/stock/stock.service';
import { PythonRunner } from 'src/common/python-runner';
import { EventService } from 'src/common/event.service';
import { EVENT_NAMES, JOB_NAMES, QUEUE_NAMES } from 'src/common/constants';
import { ParseLogService } from 'src/log/parse-log.service';
import { ParseService } from './parse.service';
import { StockPrice } from 'src/entities/stock-price.entity';
import { Job } from 'bull';
import { StartParseDto } from 'src/dto/start-parse.dto';

@Processor(QUEUE_NAMES.PARSE_QUEUE)
@Injectable()
export class ParseProcessor {
  constructor(
    private readonly stockService: StockService,
    private readonly eventService: EventService,
    private readonly parseLogService: ParseLogService,
    private readonly parseService: ParseService,
  ) {}

  @Process(JOB_NAMES.PARSE_STOCK)
  async handleParsing(job: Job) {
    const startTime = Date.now(); // 시작 시간 기록
    const rangeDate = job.data as StartParseDto;
    let modifiedCount = 0; // 수정된 데이터 개수 초기화

    this.eventService.emit(EVENT_NAMES.PROGRESS_PARSE, {
      progress: 0,
      state: 'Ready',
    });

    const symbols = await this.stockService.getAllSymbol();

    try {
      const finalData = await PythonRunner.run('src/parse/parse.py', {
        args: [
          JSON.stringify(symbols),
          rangeDate.startDate ?? '',
          rangeDate.endDate ?? '',
        ],
        onStdout: (out) => {
          if (out.progress) {
            this.eventService.emit(EVENT_NAMES.PROGRESS_PARSE, {
              progress: 30 + Math.round((out.progress / 10) * 6),
              state: 'Parsing',
            });
          }
        },
        onStderr: (err) => {
          console.error(`Python Error: ${err}`);
        },
      });

      this.eventService.emit(EVENT_NAMES.PROGRESS_PARSE, {
        progress: 90,
        state: 'Saving',
      });

      modifiedCount = await this.parseService.saveParsedData(finalData);
      const dates = this.extractParsingDates(finalData);
      this.eventService.emit(EVENT_NAMES.PROGRESS_PARSE, {
        progress: 100,
        state: 'Completed',
      });

      const executionTime = (Date.now() - startTime) / 1000;
      // ✅ 성공 로그 저장
      await this.parseLogService.recordParseLog({
        status: 'success',
        modifiedCount,
        executionTime,
        message: 'Parsing completed.',
        ...dates,
      });
    } catch (error) {
      // 🔥 Python 프로세스 강제 종료 후 에러 발생 시 로그 저장
      this.eventService.emit(EVENT_NAMES.PROGRESS_PARSE, {
        progress: 100,
        state: 'Failed',
      });
      await this.parseLogService.recordParseLog({
        status: 'fail',
        modifiedCount,
        executionTime: 0,
        message: error.toString(),
      });
      await job.moveToFailed({ message: error.toString() }, true);
    }
  }

  extractParsingDates(finalData: StockPrice[]) {
    if (finalData.length === 0) {
      return {
        parsedRangeStart: null,
        parsedRangeEnd: null,
        lastDataDate: null,
      };
    }

    // date 기준으로 정렬
    const sortedData = [...finalData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return {
      parsedRangeStart: sortedData[0].date, // 가장 오래된 날짜 (파싱 시작)
      parsedRangeEnd: sortedData[sortedData.length - 1].date, // 가장 최신 날짜 (파싱 종료)
      lastDataDate: sortedData[sortedData.length - 1].date, // 실제 거래된 마지막 날짜 (보통 parsedRangeEnd와 같음)
    };
  }
}
