import { Controller, Get, Param, Sse } from '@nestjs/common';
import { StockService } from './stock.service';
import { Observable } from 'rxjs';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('update')
  async startParsing() {
    await this.stockService.startStockParsing();
    return { message: 'Stock parsing started' };
  }

  @Get('jobs/:id')
  async removeJob(@Param('id') jobId: string) {
    return await this.stockService.removeJob(jobId);
  }

  @Sse('progress')
  progress(): Observable<MessageEvent> {
    return new Observable((observer) => {
      this.stockService.getProgressStream().subscribe((progressData) => {
        observer.next({ data: progressData } as MessageEvent);
      });
    });
  }
}
