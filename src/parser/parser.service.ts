import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class ParserService {
  async fetchStockData(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const venvPython = path.join(__dirname, '../../venv/bin/python');

      const pythonExecutable =
        os.platform() === 'win32'
          ? path.join(__dirname, '../../venv/Scripts/python.exe')
          : venvPython;

      const pythonProcess = spawn(pythonExecutable, ['src/parser/parser.py'], {
        env: { ...process.env },
      });

      let dataBuffer = '';

      pythonProcess.stdout.on('data', (data) => {
        dataBuffer += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data.toString()}`);
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const stockData = JSON.parse(dataBuffer);
            resolve(stockData);
          } catch (error) {
            console.error(`JSON Parse Error: ${error}`);
            reject(error);
          }
        } else {
          reject(new Error(`Python process exited with code ${code}`));
        }
      });
    });
  }
}
