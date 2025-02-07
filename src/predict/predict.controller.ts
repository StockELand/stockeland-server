import { Controller, Post, Sse } from '@nestjs/common';
import { PredictService } from './predict.service';
import { Observable } from 'rxjs';
import { EventService } from 'src/common/event.service';
import { EVENT_NAMES } from 'src/common/constants';

@Controller('predict')
export class PredictController {
  constructor(
    private readonly predictService: PredictService,
    private readonly eventService: EventService,
  ) {}

  @Post('update')
  async startParsing() {
    await this.predictService.startLearning();
    return { message: 'Stock parsing started' };
  }

  @Sse('progress')
  progress(): Observable<MessageEvent> {
    return new Observable((observer) => {
      this.eventService
        .getEventStream(EVENT_NAMES.PROGRESS_PREDICT)
        .subscribe((progressData) => {
          observer.next({ data: progressData } as MessageEvent);
        });
    });
  }
}
