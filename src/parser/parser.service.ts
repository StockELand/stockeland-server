import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ParserService {
  constructor(private readonly eventEmitter: EventEmitter2) {}
  async fetchStockDataWithProgress(symbols: string[]): Promise<{
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
        ['src/parser/parser.py', JSON.stringify(symbols)],
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
