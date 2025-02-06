import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { StockService } from 'src/stock/stock.service';
import { PythonRunner } from 'src/common/python-runner';
import { EventService } from 'src/common/event.service';

@Processor('stock-queue')
@Injectable()
export class ParseProcessor {
  constructor(
    private readonly stockService: StockService,
    private readonly eventService: EventService,
  ) {}

  @Process('parse-stock-data')
  async handleParsing() {
    this.eventService.emit('progress.update', {
      progress: 0,
      state: 'Ready',
    });

    const symbols = await this.stockService.findAllSymbol();

    try {
      const finalData = await PythonRunner.run('src/parse/parse.py', {
        args: [JSON.stringify(symbols)],
        onStdout: (out) => {
          if (out.progress) {
            this.eventService.emit('progress.update', {
              progress: 30 + Math.round((out.progress / 10) * 6),
              state: 'Parsing',
            });
          }
        },
        onStderr: (err) => {
          console.error(`Python Error: ${err.toString()}`);
        },
      });

      this.eventService.emit('progress.update', {
        progress: 90,
        state: 'Saving',
      });

      await this.stockService.saveToDatabase(finalData);

      this.eventService.emit('progress.update', {
        progress: 100,
        state: 'completed',
      });
    } catch (error) {
      this.eventService.emit('progress.update', {
        progress: 100,
        state: 'failed',
      });
    }
  }
}
