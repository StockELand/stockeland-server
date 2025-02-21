import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { StockService } from 'src/stock/stock.service';
import { PythonRunner } from 'src/common/python-runner';
import { EventService } from 'src/common/event.service';
import { EVENT_NAMES, JOB_NAMES, QUEUE_NAMES } from 'src/common/constants';
import { PredictionLogService } from 'src/log/prediction-log.service';
import { PredictService } from './predict.service';
import { StockPrice } from 'src/entities/stock-price.entity';
import { Job } from 'bull';

@Processor(QUEUE_NAMES.PREDICT_QUEUE)
@Injectable()
export class PredictProcessor {
  constructor(
    private readonly stockService: StockService,
    private readonly eventService: EventService,
    private readonly predictionLogService: PredictionLogService,
    private readonly predictService: PredictService,
  ) {}

  @Process(JOB_NAMES.PREDICT_MODEL)
  async handleLearning(job: Job) {
    const startTime = Date.now(); // 시작 시간 기록
    const date = job.data.date;
    let modifiedCount = 0; // 수정된 데이터 개수 초기화
    this.eventService.emit(EVENT_NAMES.PROGRESS_PREDICT, {
      progress: 0,
      state: 'Ready',
    });

    try {
      const last100StockData = await this.stockService.getLast100Close(date);
      console.log(last100StockData[last100StockData.length - 1]);

      const finalData = await PythonRunner.run('src/predict/predict.py', {
        stdInData: last100StockData,
        onStdout: (out) => {
          if (out.progress) {
            this.eventService.emit(EVENT_NAMES.PROGRESS_PREDICT, {
              progress: out.progress,
              state: 'Predicting',
            });
          }
        },
        onStderr: (err) => {
          console.error(`Python Error: ${err}`);
        },
      });

      const dates = this.extractParsingDates(last100StockData);
      modifiedCount = await this.predictService.savePredictions(
        finalData,
        date,
      );

      this.eventService.emit(EVENT_NAMES.PROGRESS_PREDICT, {
        progress: 100,
        state: 'Completed',
      });

      const executionTime = (Date.now() - startTime) / 1000;
      // 성공 로그 저장
      await this.predictionLogService.recordPredictionLog({
        status: 'success',
        modifiedCount,
        executionTime,
        message: 'Prediction completed.',
        ...dates,
      });
    } catch (error) {
      this.eventService.emit(EVENT_NAMES.PROGRESS_PREDICT, {
        progress: 100,
        state: 'Failed',
      });

      await this.predictionLogService.recordPredictionLog({
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
        lastDataDate: null,
      };
    }

    // date 기준으로 정렬
    const sortedData = [...finalData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return {
      lastDataDate: sortedData[sortedData.length - 1].date,
    };
  }
}
