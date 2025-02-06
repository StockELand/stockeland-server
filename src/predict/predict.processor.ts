import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { StockService } from 'src/stock/stock.service';
import { PythonRunner } from 'src/common/python-runner';
import { EventService } from 'src/common/event.service';

@Processor('predict-queue')
@Injectable()
export class PredictProcessor {
  constructor(
    private readonly stockService: StockService,
    private readonly eventService: EventService,
  ) {}

  @Process('predict-model-learning')
  async handleLearning() {
    this.eventService.emit('progress.learning', {
      progress: 0,
      state: 'Ready',
    });

    try {
      const last100StockData = await this.stockService.findLast100StockData();

      const finalData = await PythonRunner.run('src/predict/predict.py', {
        stdInData: last100StockData,
        onStdout: (out) => {
          if (out.progress) {
            this.eventService.emit('progress.learning', {
              progress: out.progress,
              state: 'learning',
            });
          }
        },
        onStderr: (err) => {
          console.error(`Python Error: ${err.toString()}`);
        },
      });

      await this.stockService.savePredictions(finalData);

      this.eventService.emit('progress.learning', {
        progress: 100,
        state: 'completed',
      });
    } catch (error) {
      this.eventService.emit('progress.learning', {
        progress: 100,
        state: 'failed',
      });
    }
  }
}
