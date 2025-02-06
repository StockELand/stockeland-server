import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { StockService } from 'src/stock/stock.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PythonRunner } from 'src/common/python-runner';

@Processor('predict-queue')
@Injectable()
export class PredictProcessor {
  constructor(
    private readonly stockService: StockService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Process('predict-model-learning')
  async handleLearning() {
    this.eventEmitter.emit('process.learning', {
      progress: 0,
      state: 'Ready',
    });

    try {
      const last100StockData = await this.stockService.findLast100StockData();
      console.log(last100StockData);

      const finalData = await PythonRunner.run('src/predict/predict.py', {
        stdInData: last100StockData,
        onStdout: (out) => {
          if (out.progress) {
            this.eventEmitter.emit('process.learning', {
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

      this.eventEmitter.emit('process.learning', {
        progress: 100,
        state: 'completed',
      });
    } catch (error) {
      console.log(error);
      this.eventEmitter.emit('process.learning', {
        progress: 100,
        state: 'failed',
      });
    }
  }
}
