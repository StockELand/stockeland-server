import { Injectable } from '@nestjs/common';
import { QueueService } from 'src/common/queue.service';

@Injectable()
export class ParseService {
  constructor(private readonly queueService: QueueService) {}

  async startParsing(): Promise<void> {
    await this.queueService.addJob('stock-queue', 'parse-stock-data');
  }
}
