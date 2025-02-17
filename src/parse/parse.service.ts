import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JOB_NAMES, QUEUE_NAMES } from 'src/common/constants';
import { QueueService } from 'src/common/queue.service';
import { StockData } from 'src/entities/stock.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ParseService {
  constructor(
    private readonly queueService: QueueService,
    @InjectRepository(StockData)
    private stockRepository: Repository<StockData>,
  ) {}

  async startParsing(): Promise<void> {
    await this.queueService.addJob(
      QUEUE_NAMES.PARSE_QUEUE,
      JOB_NAMES.PARSE_STOCK,
    );
  }

  async getParsedDataByDate(date: string) {
    return await this.stockRepository.find({
      where: {
        date,
      },
    });
  }
}
