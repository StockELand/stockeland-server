import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { StockService } from 'src/stock/stock.service';
import { PythonRunner } from 'src/common/python-runner';
import { EventService } from 'src/common/event.service';
import { EVENT_NAMES, JOB_NAMES, QUEUE_NAMES } from 'src/common/constants';
import { ParseLogService } from 'src/logs/parse-log.service';

@Processor(QUEUE_NAMES.PARSE_QUEUE)
@Injectable()
export class ParseProcessor {
  constructor(
    private readonly stockService: StockService,
    private readonly eventService: EventService,
    private readonly parseLogService: ParseLogService,
  ) {}

  @Process(JOB_NAMES.PARSE_STOCK)
  async handleParsing() {
    const startTime = Date.now(); // 시작 시간 기록
    let modifiedCount = 0; // 수정된 데이터 개수 초기화

    this.eventService.emit(EVENT_NAMES.PROGRESS_PARSE, {
      progress: 0,
      state: 'Ready',
    });

    const symbols = await this.stockService.getAllSymbol();

    try {
      const finalData = await PythonRunner.run('src/parse/parse.py', {
        args: [JSON.stringify(symbols)],
        onStdout: (out) => {
          if (out.progress) {
            this.eventService.emit(EVENT_NAMES.PROGRESS_PARSE, {
              progress: 30 + Math.round((out.progress / 10) * 6),
              state: 'Parsing',
            });
          }
        },
        onStderr: (err) => {
          console.error(`Python Error: ${err.toString()}`);
        },
      });

      this.eventService.emit(EVENT_NAMES.PROGRESS_PARSE, {
        progress: 90,
        state: 'Saving',
      });

      modifiedCount = await this.stockService.saveClose(finalData);

      this.eventService.emit(EVENT_NAMES.PROGRESS_PARSE, {
        progress: 100,
        state: 'completed',
      });

      const executionTime = (Date.now() - startTime) / 1000;
      // 성공 로그 저장
      await this.parseLogService.logParseResult(
        'success',
        modifiedCount,
        executionTime,
        'Parsing completed.',
      );
    } catch (error) {
      this.eventService.emit(EVENT_NAMES.PROGRESS_PARSE, {
        progress: 100,
        state: 'failed',
      });
      await this.parseLogService.logParseResult(
        'fail',
        modifiedCount,
        0,
        error.toString(),
      );
    }
  }
}
