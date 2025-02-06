import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Subject } from 'rxjs';

interface ProgressUpdatePayload {
  progress: number;
  state: string;
}

@Injectable()
export class PredictService {
  private progressSubject = new Subject<ProgressUpdatePayload>();

  constructor(@InjectQueue('predict-queue') private predictQueue: Queue) {}

  getProgressStream() {
    return this.progressSubject.asObservable();
  }

  @OnEvent('process.learning')
  handleProgressUpdate(payload: ProgressUpdatePayload) {
    this.progressSubject.next(payload);
  }
  async removeJob(jobId: string): Promise<{ message: string }> {
    const job = await this.predictQueue.getJob(jobId);
    if (!job) {
      return { message: `Job with ID ${jobId} not found.` };
    }

    await job.remove();
    return { message: `Job with ID ${jobId} has been removed.` };
  }

  async startLearning(): Promise<void> {
    const existingJobs = await this.predictQueue.getJobs([
      'waiting',
      'active',
      'delayed',
    ]);

    if (existingJobs.length > 0) {
      console.log(
        `A job is already in progress. Job ID: ${existingJobs[0].id}`,
      );
      return;
    }

    await this.predictQueue.add('predict-model-learning');
    console.log('New job added to queue.');
  }
}
