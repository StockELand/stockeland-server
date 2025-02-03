import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { StockService } from 'src/stock/stock.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job } from 'bull';
import { ParseService } from './parse.service';

@Processor('stock-queue')
@Injectable()
export class ParseProcessor {
  constructor(
    private readonly parseService: ParseService,
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
      const { finalData } = await this.parseService.parseStockData(symbols);

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
      this.eventEmitter.emit('progress.update', {
        progress: 100,
        state: 'failed',
      });
    }
  }
}
