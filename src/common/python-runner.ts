import { spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';

export interface PythonRunOptions {
  args?: any[];
  stdInData?: any;
  onStdout?: (out: any) => void;
  onStderr?: (err: any) => void;
}

export type PythonRunResult = any[];

export class PythonRunner {
  static async run(
    scriptPath,
    { args = [], onStdout, onStderr, stdInData }: PythonRunOptions,
  ): Promise<PythonRunResult> {
    return new Promise((resolve, reject) => {
      const finalData = [];
      const venvPython = path.join(__dirname, '../../venv/bin/python');
      const pythonExecutable =
        os.platform() === 'win32'
          ? path.join(__dirname, '../../venv/Scripts/python.exe')
          : venvPython;

      const pythonProcess = spawn(pythonExecutable, [scriptPath, ...args], {
        env: { ...process.env },
      });

      let stderrData = '';

      if (stdInData) {
        const jsonString = JSON.stringify(stdInData);
        const bufferSize = 64 * 1024;
        for (let i = 0; i < jsonString.length; i += bufferSize) {
          pythonProcess.stdin.write(jsonString.slice(i, i + bufferSize));
        }
        pythonProcess.stdin.end();
      }

      pythonProcess.stdout.on('data', (data) => {
        const lines = data
          .toString()
          .split('\n')
          .filter((line) => line.trim());
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            onStdout(parsed);
            if (parsed.data) {
              finalData.push(parsed.data);
            }
          } catch (error) {
            console.error(`Invalid JSON from Python: ${line}`);
          }
        }
      });

      pythonProcess.stderr.on('data', (err) => {
        const errorMessage = err.toString();
        stderrData += errorMessage;
        if (onStderr) onStderr(errorMessage);

        // // 특정 경고 메시지를 무시하도록 처리
        // if (errorMessage.includes('YFTzMissingError')) {
        //   console.warn(`Warning: ${errorMessage}`);
        //   return; // 프로세스를 종료하지 않고 반환
        // }

        // // 다른 오류에 대해서만 프로세스 종료 및 예외 발생
        // pythonProcess.kill('SIGTERM');
        // reject(new Error(`Python Error: ${stderrData}`));
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(finalData);
        } else {
          const error = new Error(
            `Python process exited with code ${code}\nError: ${stderrData}`,
          );
          reject(error);
        }
      });
    });
  }
}
