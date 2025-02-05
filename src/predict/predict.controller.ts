import { Controller, Get, Param, Sse } from '@nestjs/common';
import { PredictService } from './predict.service';
import { Observable } from 'rxjs';

@Controller('predict')
export class PredictController {
  constructor(private readonly predictService: PredictService) {}

  @Get('update')
  async startParsing() {
    await this.predictService.startLearning();
    return { message: 'Stock parsing started' };
  }

  @Get('remove-job/:id')
  async removeJob(@Param('id') jobId: string) {
    return await this.predictService.removeJob(jobId);
  }

  @Sse('progress')
  progress(): Observable<MessageEvent> {
    return new Observable((observer) => {
      this.predictService.getProgressStream().subscribe((progressData) => {
        observer.next({ data: progressData } as MessageEvent);
      });
    });
  }
}
