import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Subject } from 'rxjs';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { StockService } from 'src/stock/stock.service';

interface ProgressUpdatePayload {
  progress: number;
  state: string;
}

@Injectable()
export class ParseService {
  private progressSubject = new Subject<ProgressUpdatePayload>();

  constructor(
    @InjectQueue('stock-queue') private stockQueue: Queue,
    private readonly stockService: StockService,
  ) {}

  getProgressStream() {
    return this.progressSubject.asObservable();
  }

  @OnEvent('progress.update')
  handleProgressUpdate(payload: ProgressUpdatePayload) {
    this.progressSubject.next(payload);
  }

  async removeJob(jobId: string): Promise<{ message: string }> {
    const job = await this.stockQueue.getJob(jobId);
    if (!job) {
      return { message: `Job with ID ${jobId} not found.` };
    }

    await job.remove();
    return { message: `Job with ID ${jobId} has been removed.` };
  }

  async startStockParsing(): Promise<void> {
    const existingJobs = await this.stockQueue.getJobs([
      'waiting',
      'active',
      'delayed',
    ]);

    if (existingJobs.length > 0) {
      console.log(
        `A job is already in progress. Job ID: ${existingJobs[0].id}`,
      );
      return;
    }

    const symbols = await this.stockService.findAllSymbol();
    await this.stockQueue.add('parse-stock-data', { symbols });
    console.log('New job added to queue.');
  }
}
