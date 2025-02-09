import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { StockService } from 'src/stock/stock.service';
import { PythonRunner } from 'src/common/python-runner';
import { EventService } from 'src/common/event.service';
import { EVENT_NAMES, JOB_NAMES, QUEUE_NAMES } from 'src/common/constants';

@Processor(QUEUE_NAMES.PREDICT_QUEUE)
@Injectable()
export class PredictProcessor {
  constructor(
    private readonly stockService: StockService,
    private readonly eventService: EventService,
  ) {}

  @Process(JOB_NAMES.LEARNING_PREDICT_MODEL)
  async handleLearning() {
    this.eventService.emit(EVENT_NAMES.PROGRESS_PREDICT, {
      progress: 0,
      state: 'Ready',
    });

    try {
      const last100StockData = await this.stockService.getLast100Close();
      const lastDate = last100StockData[last100StockData.length - 1].date;

      const finalData = await PythonRunner.run('src/predict/predict.py', {
        stdInData: last100StockData,
        onStdout: (out) => {
          if (out.progress) {
            this.eventService.emit(EVENT_NAMES.PROGRESS_PREDICT, {
              progress: out.progress,
              state: 'learning',
            });
          }
        },
        onStderr: (err) => {
          console.error(`Python Error: ${err.toString()}`);
        },
      });

      await this.stockService.savePredictions(finalData, lastDate);

      this.eventService.emit(EVENT_NAMES.PROGRESS_PREDICT, {
        progress: 100,
        state: 'completed',
      });
    } catch (error) {
      this.eventService.emit(EVENT_NAMES.PROGRESS_PREDICT, {
        progress: 100,
        state: 'failed',
      });
    }
  }
}
