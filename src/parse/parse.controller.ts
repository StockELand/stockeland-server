import { Controller, Get, Param, Post, Sse } from '@nestjs/common';
import { ParseService } from './parse.service';
import { Observable } from 'rxjs';

@Controller('parse')
export class ParseController {
  constructor(private readonly parseService: ParseService) {}

  @Post('update')
  async startParsing() {
    await this.parseService.startStockParsing();
    return { message: 'Stock parsing started' };
  }

  @Get('jobs/:id')
  async removeJob(@Param('id') jobId: string) {
    return await this.parseService.removeJob(jobId);
  }

  @Sse('progress')
  progress(): Observable<MessageEvent> {
    return new Observable((observer) => {
      this.parseService.getProgressStream().subscribe((progressData) => {
        observer.next({ data: progressData } as MessageEvent);
      });
    });
  }
}
