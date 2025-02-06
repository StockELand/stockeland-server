import { Injectable } from '@nestjs/common';
import { QueueService } from 'src/common/queue.service';
@Injectable()
export class PredictService {
  constructor(private readonly queueService: QueueService) {}

  async startLearning(): Promise<void> {
    await this.queueService.addJob('predict-queue', 'predict-model-learning');
  }
}
