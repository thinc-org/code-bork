/* eslint import/prefer-default-export: off, global-require: off, no-console: off, promise/always-return: off */

import {
  BrowserWindow,
  IpcMainInvokeEvent,
  ipcMain,
  IpcMainEvent,
} from 'electron';
import { writeFileSync } from 'fs';
import { spawn } from 'child_process';

const compileAndSync = (path: string, mainWindow: BrowserWindow) => {
  return new Promise((resolve, reject) => {
    const terminal = spawn('g++', [
      '-std=c++11',
      path,
      '-o',
      path.split('.')[0],
    ]);
    terminal.stderr.on('data', (data: string) => {
      console.log('terminal-stderr', data.toString());
      mainWindow.webContents.send('terminal-stdout', {
        data: data.toString(),
        from: 'stderr',
      });
    });
    terminal.on('exit', (code: number) => {
      console.log(`child process exited with code ${code}`);
      resolve(code === 0);
    });
  });
};

let hasRunningProcess = false;

const runAndSync = (path: string, mainWindow: BrowserWindow) => {
  try {
    const terminal = spawn(`${path}`);
    hasRunningProcess = true;
    process.stdin.setRawMode(true);
    process.stdin.setEncoding('utf8');
    terminal.stdout.on('data', (data: string) => {
      console.log('terminal-stdout', data.toString());
      mainWindow.webContents.send('terminal-stdout', {
        data: data.toString(),
        from: 'stdout',
      });
    });
    let stdinBuffer = '';

    const onStdin = (_event: IpcMainEvent, arg: string[]) => {
      console.log('got stdin', arg[0]);
      const stdin = arg[0] as string;
      const key = arg[1] as string;
      stdinBuffer += stdin;
      // terminal.stdin.write(stdin);
      if (key === 'backspace') {
        stdinBuffer = stdinBuffer.slice(0, -1);
        console.log('got backspace');
        mainWindow.webContents.send('terminal-stdout', {
          data: 'backspace',
          from: 'stdin',
        });
      } else {
        mainWindow.webContents.send('terminal-stdout', {
          data: stdin,
          from: 'stdin',
        });
      }
      if (stdin.endsWith('\n')) {
        terminal.stdin.write(stdinBuffer);
        terminal.stdin.end();
        stdinBuffer = '';
      }
    };
    ipcMain.on('terminal-stdin', onStdin);

    terminal.stderr.on('data', (data: string) => {
      console.log('terminal-stderr', data.toString());
      mainWindow.webContents.send('terminal-stdout', {
        data: data.toString(),
        from: 'stderr',
      });
    });

    terminal.on('error', (err: Error) => {
      ipcMain.removeListener('terminal-stdin', onStdin);
      console.log(err);
      hasRunningProcess = false;
    });
    terminal.on('exit', (code: number) => {
      ipcMain.removeListener('terminal-stdin', onStdin);
      hasRunningProcess = false;
      console.log(`child process exited with code ${code}`);
      mainWindow.webContents.send('terminal-exit', code);
    });
    return () => {
      terminal.kill('SIGINT');
    };
  } catch (error) {
    console.log(error);
  }
};
let lastProcessKill = () => {};
export const onRun = async (
  _event: IpcMainInvokeEvent,
  arg: string[],
  mainWindow: BrowserWindow | null
) => {
  if (mainWindow) {
    mainWindow.webContents.send('terminal-open-new', {});
    const code = arg[0];
    let path = arg[1];
    const fileName = arg[1].split('/')[arg[1].split('/').length - 1];
    writeFileSync(path, code);
    if (!(await compileAndSync(path, mainWindow))) {
      return;
    }
    if (path.includes('.cpp')) {
      path = path.split('.cpp')[0].split('/').slice(0, -1).join('/');
    }
    ipcMain.removeAllListeners('terminal-stdin');
    if (hasRunningProcess && lastProcessKill) {
      console.log('killing last process');
      lastProcessKill();
      hasRunningProcess = false;
    }
    lastProcessKill = runAndSync(
      `${path}/${fileName.split('.')[0]}`,
      mainWindow
    ) as () => void;
  }
};
