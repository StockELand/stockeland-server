import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ParserService } from 'src/parser/parser.service';
import { StockService } from './stock.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job } from 'bull';

@Processor('stock-queue')
@Injectable()
export class StockProcessor {
  constructor(
    private readonly parserService: ParserService,
    private readonly stockService: StockService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Process('parse-stock-data')
  async handleParsing(job: Job) {
    const { symbols } = job.data;

    this.eventEmitter.emit('progress.update', {
      progress: 0,
      state: 'Ready',
    });

    try {
      const { finalData } = await this.parserService.fetchStockDataWithProgress(
        symbols,
      );

      this.eventEmitter.emit('progress.update', {
        progress: 90,
        state: 'Saving',
      });

      await this.stockService.saveToDatabase(finalData);

      this.eventEmitter.emit('progress.update', {
        progress: 100,
        state: 'completed',
      });
    } catch (error) {
      console.error(`❌ Stock Parsing 중 에러 발생: ${error}`);
      this.eventEmitter.emit('progress.update', {
        progress: 100,
        state: 'failed',
      });
    }
  }
}
