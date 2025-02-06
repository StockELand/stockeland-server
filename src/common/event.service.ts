import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Subject } from 'rxjs';

interface ProgressPayload {
  progress: number;
  state: string;
}

@Injectable()
export class EventService {
  private progressSubject = new Subject<ProgressPayload>();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  getEventStream() {
    return this.progressSubject.asObservable();
  }

  emit(eventName: string, payload: ProgressPayload) {
    this.eventEmitter.emit(eventName, payload);
  }

  @OnEvent('progress.*')
  handleEvent(payload: ProgressPayload) {
    this.progressSubject.next(payload);
  }
}
