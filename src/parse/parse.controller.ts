import { Controller, Post, Sse } from '@nestjs/common';
import { ParseService } from './parse.service';
import { Observable } from 'rxjs';
import { EventService } from 'src/common/event.service';

@Controller('parse')
export class ParseController {
  constructor(
    private readonly parseService: ParseService,
    private readonly eventService: EventService,
  ) {}

  @Post('update')
  async startParsing() {
    await this.parseService.startParsing();
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
