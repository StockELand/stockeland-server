import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Subject, Observable } from 'rxjs';

interface ProgressPayload {
  progress: number;
  state: string;
}

@Injectable()
export class EventService {
  private progressSubjects: Map<string, Subject<ProgressPayload>> = new Map();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  private getOrCreateSubject(eventName: string): Subject<ProgressPayload> {
    if (!this.progressSubjects.has(eventName)) {
      this.progressSubjects.set(eventName, new Subject<ProgressPayload>());
    }
    return this.progressSubjects.get(eventName);
  }

  getEventStream(eventName: string): Observable<ProgressPayload> {
    return this.getOrCreateSubject(eventName).asObservable();
  }

  emit(eventName: string, payload: ProgressPayload) {
    this.eventEmitter.emit(eventName, { eventName, payload });
  }

  @OnEvent('progress.*')
  handleEvent({ eventName, payload }) {
    this.getOrCreateSubject(eventName).next(payload);
  }
}
