import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JOB_NAMES, QUEUE_NAMES } from 'src/common/constants';
import { QueueService } from 'src/common/queue.service';
import { StockPrice } from 'src/entities/stock-price.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ParseService {
  constructor(
    private readonly queueService: QueueService,
    @InjectRepository(StockPrice)
    private stockRepository: Repository<StockPrice>,
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
