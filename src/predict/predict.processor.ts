import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { StockService } from 'src/stock/stock.service';
import { PythonRunner } from 'src/common/python-runner';
import { EventService } from 'src/common/event.service';
import { EVENT_NAMES, JOB_NAMES, QUEUE_NAMES } from 'src/common/constants';
import { PredictLogService } from 'src/log/predict-log.service';

@Processor(QUEUE_NAMES.PREDICT_QUEUE)
@Injectable()
export class PredictProcessor {
  constructor(
    private readonly stockService: StockService,
    private readonly eventService: EventService,
    private readonly predictionLogService: PredictLogService,
  ) {}

  @Process(JOB_NAMES.LEARNING_PREDICT_MODEL)
  async handleLearning() {
    const startTime = Date.now(); // 시작 시간 기록
    let modifiedCount = 0; // 수정된 데이터 개수 초기화

    this.eventService.emit(EVENT_NAMES.PROGRESS_PREDICT, {
      progress: 0,
      state: 'Ready',
    });

    try {
      const last100StockData = await this.stockService.getLast100Close();

      const finalData = await PythonRunner.run('src/predict/predict.py', {
        stdInData: last100StockData,
        onStdout: (out) => {
          if (out.progress) {
            this.eventService.emit(EVENT_NAMES.PROGRESS_PREDICT, {
              progress: out.progress,
              state: 'Learning',
            });
          }
        },
        onStderr: (err) => {
          console.error(`Python Error: ${err.toString()}`);
        },
      });

      modifiedCount = await this.stockService.savePredictions(finalData);

      this.eventService.emit(EVENT_NAMES.PROGRESS_PREDICT, {
        progress: 100,
        state: 'Completed',
      });

      const executionTime = (Date.now() - startTime) / 1000;
      // 성공 로그 저장
      await this.predictionLogService.recordPredictLog(
        'success',
        modifiedCount,
        executionTime,
        'Prediction completed.',
      );
    } catch (error) {
      this.eventService.emit(EVENT_NAMES.PROGRESS_PREDICT, {
        progress: 100,
        state: 'Failed',
      });

      await this.predictionLogService.recordPredictLog(
        'fail',
        modifiedCount,
        0,
        error.toString(),
      );
    }
  }
}
