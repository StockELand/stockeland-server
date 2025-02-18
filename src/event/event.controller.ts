import { Controller, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { EVENT_NAMES } from 'src/common/constants';
import { EventService } from 'src/common/event.service';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Sse('parse/progress')
  parseProgress(): Observable<MessageEvent> {
    return new Observable((observer) => {
      this.eventService
        .getEventStream(EVENT_NAMES.PROGRESS_PARSE)
        .subscribe((progressData) => {
          observer.next({ data: progressData } as MessageEvent);
        });
    });
  }

  @Sse('predict/progress')
  predictProgress(): Observable<MessageEvent> {
    return new Observable((observer) => {
      this.eventService
        .getEventStream(EVENT_NAMES.PROGRESS_PREDICT)
        .subscribe((progressData) => {
          observer.next({ data: progressData } as MessageEvent);
        });
    });
  }
}
