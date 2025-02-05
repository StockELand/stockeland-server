import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { StockService } from 'src/stock/stock.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PredictService } from './predict.service';

@Processor('predict-queue')
@Injectable()
export class PredictProcessor {
  constructor(
    private readonly predictService: PredictService,
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
      const { finalData } = await this.predictService.predictModelLeaning(
        await this.stockService.findLast100StockData(),
      );
      await this.stockService.savePredictions(finalData);

      this.eventEmitter.emit('process.learning', {
        progress: 100,
        state: 'completed',
      });
    } catch (error) {
      this.eventEmitter.emit('process.learning', {
        progress: 100,
        state: 'failed',
      });
    }
  }
}
