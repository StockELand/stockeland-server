import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
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

  constructor(
    @InjectQueue('predict-queue') private predictQueue: Queue,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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

  async predictModelLeaning(stockData: any[]): Promise<{
    finalData: any[];
  }> {
    return new Promise((resolve, reject) => {
      const venvPython = path.join(__dirname, '../../venv/bin/python');
      const pythonExecutable =
        os.platform() === 'win32'
          ? path.join(__dirname, '../../venv/Scripts/python.exe')
          : venvPython;
      const pythonProcess = spawn(
        pythonExecutable,
        ['src/predict/predict.py'],
        {
          env: { ...process.env },
        },
      );

      const jsonString = JSON.stringify(stockData);
      const bufferSize = 64 * 1024; // 64KB씩 전송
      for (let i = 0; i < jsonString.length; i += bufferSize) {
        pythonProcess.stdin.write(jsonString.slice(i, i + bufferSize));
      }
      pythonProcess.stdin.end();

      let lastProgress = -1;
      const finalData: any[] = [];

      pythonProcess.stdout.on('data', (data) => {
        const lines = data
          .toString()
          .split('\n')
          .filter((line) => line.trim());
        for (const line of lines) {
          if (!line) continue;
          try {
            const parsed = JSON.parse(line);
            if (
              parsed.progress !== undefined &&
              parsed.progress !== lastProgress
            ) {
              lastProgress = parsed.progress;
              console.log(parsed.progress);
              this.eventEmitter.emit('process.learning', {
                progress: parsed.progress,
                state: 'learning',
              });
            }
            if (parsed.data) {
              finalData.push(parsed.data);
              console.log(parsed.data);
            }
          } catch (error) {
            console.error(`Invalid JSON from Python: ${line}`);
          }
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data.toString()}`);
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ finalData });
        } else {
          reject(new Error(`Python process exited with code ${code}`));
        }
      });
    });
  }
}
