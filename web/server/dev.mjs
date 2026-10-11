import { spawn } from 'node:child_process';

const api = spawn(process.execPath, ['server/index.mjs'], { stdio: 'inherit' });
const web = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '0.0.0.0'], { stdio: 'inherit' });
const children = [api, web];
let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;
  for (const child of children) {
    if (child.exitCode === null) child.kill('SIGTERM');
  }
}

for (const child of children) {
  child.on('error', error => {
    console.error('Could not start development process:', error);
    stop(1);
  });
  child.on('exit', code => {
    if (!stopping && code !== 0) stop(code || 1);
  });
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));