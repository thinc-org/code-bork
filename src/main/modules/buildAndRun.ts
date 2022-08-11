import { IpcMainInvokeEvent } from 'electron';
import { writeFileSync } from 'fs';
import { spawnPromise } from '../util';
export const onRun = async (_event: IpcMainInvokeEvent, arg: string[]) => {
  const code = arg[0];
  let path = arg[1];
  let fileName = arg[1].split('/')[arg[1].split('/').length - 1];
  writeFileSync(path, code);
  await spawnPromise('g++', ['-std=c++11', path, '-o', path.split('.')[0]]);
  console.log('build done');
  if (path.includes('.cpp')) {
    path = path.split('.cpp')[0].split('/').slice(0, -1).join('/');
  }
  await spawnPromise('open', [
    '-a',
    'Terminal',
    '--new',
    path,
    path + '/' + fileName.split('.')[0],
  ]);
};
