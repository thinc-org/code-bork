/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import { spawn } from 'child_process';

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export const spawnPromise = (command: string, args: string[]) => {
  console.log('spawn', command, args);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    child.stdout
      .on('data', (data: string) => {
        console.log(`stdout: ${data}`);
      })
      .on('error', (err: string) => {
        console.log(`error: ${err}`);
      })
      .on('close', (code: number) => {
        console.log(`child process exited with code ${code}`);
        resolve(code);
      })
      .on('exit', (code: number) => {
        console.log(`child process exited with code ${code}`);
        resolve(code);
      })
      .on('disconnect', () => {
        console.log('disconnect');
      })
      .on('error', (err) => {
        console.log(`error: ${err}`);
        reject(err);
      });

    child.stderr.on('data', (data: string) => {
      console.log(`stderr: ${data}`);
    });
  });
};
