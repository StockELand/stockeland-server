import { Controller, Get, Sse } from '@nestjs/common';
import { PredictService } from './predict.service';
import { Observable } from 'rxjs';
import { EventService } from 'src/common/event.service';

@Controller('predict')
export class PredictController {
  constructor(
    private readonly predictService: PredictService,
    private readonly eventService: EventService,
  ) {}

  @Get('update')
  async startParsing() {
    await this.predictService.startLearning();
    return { message: 'Stock parsing started' };
  }

  @Sse('progress')
  progress(): Observable<MessageEvent> {
    return new Observable((observer) => {
      this.eventService.getEventStream().subscribe((progressData) => {
        observer.next({ data: progressData } as MessageEvent);
      });
    });
  }
}
