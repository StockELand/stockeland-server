import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JOB_NAMES, QUEUE_NAMES } from 'src/common/constants';
import { QueueService } from 'src/common/queue.service';
import { StockPrediction } from 'src/entities/stock-prediction.entity';
import { Repository } from 'typeorm';
@Injectable()
export class PredictService {
  constructor(
    private readonly queueService: QueueService,
    @InjectRepository(StockPrediction)
    private predictionRepository: Repository<StockPrediction>,
  ) {}

  async startLearning(): Promise<void> {
    await this.queueService.addJob(
      QUEUE_NAMES.PREDICT_QUEUE,
      JOB_NAMES.LEARNING_PREDICT_MODEL,
    );
  }
  async getPredictedDataByDate(date: string) {
    return await this.predictionRepository.find({
      where: {
        predicted_at: date,
      },
    });
  }
}
