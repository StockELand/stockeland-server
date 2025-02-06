import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QUEUE_NAMES } from './constants';

@Injectable()
export class QueueService {
  private queues: Map<string, Queue>;
  constructor(
    @InjectQueue(QUEUE_NAMES.PARSE_QUEUE) private parseQueue: Queue,
    @InjectQueue(QUEUE_NAMES.PREDICT_QUEUE) private predictQueue: Queue,
  ) {
    this.queues = new Map([
      [QUEUE_NAMES.PARSE_QUEUE, this.parseQueue],
      [QUEUE_NAMES.PREDICT_QUEUE, this.predictQueue],
    ]);
  }

  async removeJob(
    queueName: string,
    jobId: string,
  ): Promise<{ message: string }> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found.`);
    }
    const job = await queue.getJob(jobId);
    if (!job) {
      return { message: `Job with ID ${jobId} not found in ${queueName}.` };
    }

    await job.remove();
    return {
      message: `Job with ID ${jobId} has been removed from ${queueName}.`,
    };
  }

  async addJob(
    queueName: string,
    jobName: string,
    payload?: any,
  ): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found.`);
    }
    const existingJobs = await queue.getJobs(['waiting', 'active', 'delayed']);
    if (existingJobs.length > 0) {
      console.log(
        `A job is already in progress in ${queueName}. Job ID: ${existingJobs[0].id}`,
      );
      return;
    }

    await queue.add(jobName, payload);
    console.log(`New job added to queue: ${jobName} in ${queueName}`);
  }
}
