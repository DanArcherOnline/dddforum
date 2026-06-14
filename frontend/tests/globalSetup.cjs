const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const os = require('os');

function waitForPort(url, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      http.get(url, () => resolve())
        .on('error', () => {
          if (Date.now() - start > timeoutMs) {
            reject(new Error(`Timed out waiting for ${url}`));
          } else {
            setTimeout(check, 500);
          }
        });
    };
    check();
  });
}

module.exports = async function globalSetup() {
  const envPath = path.join(__dirname, '../../backend/.env');
  require('dotenv').config({ path: envPath });

  const root = path.join(__dirname, '../..');

  const backend = spawn(
    'npx',
    ['ts-node', '--project', 'tsconfig.json', '-r', 'dotenv/config', 'src/index.ts'],
    {
      cwd: path.join(root, 'backend'),
      stdio: 'ignore',
      env: { ...process.env, PORT: '3000' },
    }
  );

  const frontend = spawn('npx', ['vite', '--port', '5173'], {
    cwd: path.join(root, 'frontend'),
    stdio: 'ignore',
    env: { ...process.env },
  });

  fs.writeFileSync(
    path.join(os.tmpdir(), 'dddforum-e2e-pids.json'),
    JSON.stringify({ backendPid: backend.pid, frontendPid: frontend.pid })
  );

  await Promise.all([
    waitForPort('http://localhost:3000'),
    waitForPort('http://localhost:5173'),
  ]);
};
