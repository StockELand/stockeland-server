import { Injectable } from '@nestjs/common';
import { JOB_NAMES, QUEUE_NAMES } from 'src/common/constants';
import { QueueService } from 'src/common/queue.service';
@Injectable()
export class PredictService {
  constructor(private readonly queueService: QueueService) {}

  async startLearning(): Promise<void> {
    await this.queueService.addJob(
      QUEUE_NAMES.PREDICT_QUEUE,
      JOB_NAMES.LEARNING_PREDICT_MODEL,
    );
  }
}
