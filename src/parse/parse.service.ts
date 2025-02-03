import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import { Subject } from 'rxjs';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { StockService } from 'src/stock/stock.service';

interface ProgressUpdatePayload {
  progress: number;
  state: string;
}

@Injectable()
export class ParseService {
  private progressSubject = new Subject<ProgressUpdatePayload>();

  constructor(
    @InjectQueue('stock-queue') private stockQueue: Queue,
    private readonly eventEmitter: EventEmitter2,
    private readonly stockService: StockService,
  ) {}

  getProgressStream() {
    return this.progressSubject.asObservable();
  }

  @OnEvent('progress.update')
  handleProgressUpdate(payload: ProgressUpdatePayload) {
    this.progressSubject.next(payload);
  }

  async removeJob(jobId: string): Promise<{ message: string }> {
    const job = await this.stockQueue.getJob(jobId);
    if (!job) {
      return { message: `Job with ID ${jobId} not found.` };
    }

    await job.remove();
    return { message: `Job with ID ${jobId} has been removed.` };
  }

  async startStockParsing(): Promise<void> {
    const existingJobs = await this.stockQueue.getJobs([
      'waiting',
      'active',
      'delayed',
    ]);

    // console.log(existingJobs);

    if (existingJobs.length > 0) {
      console.log(
        `A job is already in progress. Job ID: ${existingJobs[0].id}`,
      );
      return;
    }

    const symbols = this.stockService.getStockSymbols();
    await this.stockQueue.add('parse-stock-data', { symbols });
    console.log('New job added to queue.');
  }

  async parseStockData(symbols: string[]): Promise<{
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
        ['src/parse/parse.py', JSON.stringify(symbols)],
        {
          env: { ...process.env },
        },
      );
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
              this.eventEmitter.emit('progress.update', {
                progress: 30 + Math.round((parsed.progress / 10) * 6),
                state: 'Parsing',
              });
            }
            if (parsed.data) {
              finalData.push(parsed.data);
              // console.log(`✅ Received ${finalData.length} records so far`);
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
