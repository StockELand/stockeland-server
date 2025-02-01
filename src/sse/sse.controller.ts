import { Controller, Sse } from '@nestjs/common';
import { interval, map, Observable, takeWhile } from 'rxjs';

interface ProcessType {
  progress: number;
  state: string;
}

@Controller('sse')
export class SseController {
  @Sse('progress')
  progress(): Observable<MessageEvent<ProcessType>> {
    return interval(1000).pipe(
      map((count: number) => {
        const progress = Math.min((count + 1) * 10, 100);
        const state = progress < 100 ? 'running' : 'completed';
        return { data: { progress, state } } as MessageEvent<ProcessType>;
      }),
      takeWhile(
        (messageEvent: MessageEvent<ProcessType>) =>
          messageEvent.data.progress < 100,
        true,
      ),
    );
  }
}
