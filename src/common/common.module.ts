import { Global, Module } from '@nestjs/common';
import { EventService } from './event.service';
import { QueueService } from './queue.service';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({ name: 'predict-queue' }),
    BullModule.registerQueue({ name: 'stock-queue' }),
    EventEmitterModule.forRoot({ wildcard: true }),
  ],
  providers: [EventService, QueueService],
  exports: [EventService, QueueService],
})
export class CommonModule {}
