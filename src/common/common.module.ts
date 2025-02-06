import { Global, Module } from '@nestjs/common';
import { EventService } from './event.service';
import { QueueService } from './queue.service';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { QUEUE_NAMES } from './constants';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.PARSE_QUEUE }),
    BullModule.registerQueue({ name: QUEUE_NAMES.PREDICT_QUEUE }),
    EventEmitterModule.forRoot({ wildcard: true }),
  ],
  providers: [EventService, QueueService],
  exports: [EventService, QueueService],
})
export class CommonModule {}
