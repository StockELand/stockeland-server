import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { StockService } from 'src/stock/stock.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job } from 'bull';
import { PythonRunner } from 'src/common/python-runner';

@Processor('stock-queue')
@Injectable()
export class ParseProcessor {
  constructor(
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
      const finalData = await PythonRunner.run('src/parse/parse.py', {
        args: [JSON.stringify(symbols)],
        onStdout: (out) => {
          if (out.progress) {
            this.eventEmitter.emit('progress.update', {
              progress: 30 + Math.round((out.progress / 10) * 6),
              state: 'Parsing',
            });
          }
        },
        onStderr: (err) => {
          console.error(`Python Error: ${err.toString()}`);
        },
      });

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
