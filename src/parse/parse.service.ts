import { Injectable } from '@nestjs/common';
import { JOB_NAMES, QUEUE_NAMES } from 'src/common/constants';
import { QueueService } from 'src/common/queue.service';

@Injectable()
export class ParseService {
  constructor(private readonly queueService: QueueService) {}

  async startParsing(): Promise<void> {
    await this.queueService.addJob(
      QUEUE_NAMES.PARSE_QUEUE,
      JOB_NAMES.PARSE_STOCK,
    );
  }
}
