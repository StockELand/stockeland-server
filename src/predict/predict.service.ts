import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JOB_NAMES, QUEUE_NAMES } from 'src/common/constants';
import { QueueService } from 'src/common/queue.service';
import { StockPrediction } from 'src/entities/stock-prediction.entity';
import { StockService } from 'src/stock/stock.service';
import { Repository } from 'typeorm';
@Injectable()
export class PredictService {
  constructor(
    private readonly queueService: QueueService,
    @InjectRepository(StockPrediction)
    private predictionRepository: Repository<StockPrediction>,
    private readonly stockRepository: StockService,
  ) {}

  async startPredicting(): Promise<void> {
    await this.queueService.addJob(
      QUEUE_NAMES.PREDICT_QUEUE,
      JOB_NAMES.PREDICT_MODEL,
    );
  }

  async savePredictions(
    predictions: { symbol: string; change_percent: number }[],
    date?: string,
  ): Promise<number> {
    if (predictions.length === 0) return 0;

    try {
      const today = new Date(
        date ? date : await this.stockRepository.getTradingDate(),
      )
        .toISOString()
        .split('T')[0];

      const result = await this.predictionRepository
        .createQueryBuilder()
        .insert()
        .into(StockPrediction)
        .values(
          predictions.map((prediction) => ({
            ...prediction,
            predictedAt: today,
          })),
        )
        .orUpdate(['change_percent'], ['symbol', 'predicted_at'], {
          skipUpdateIfNoValuesChanged: true,
        })
        .execute();

      const affectedRows = result.raw?.affectedRows ?? predictions.length;

      return affectedRows;
    } catch (error) {
      throw error;
    }
  }

  async getPredictedDataByDate(date: string) {
    return await this.predictionRepository.find({
      where: {
        predictedAt: date,
      },
    });
  }
}
