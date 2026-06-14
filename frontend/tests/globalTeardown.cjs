const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = async function globalTeardown() {
  const pidFile = path.join(os.tmpdir(), 'dddforum-e2e-pids.json');
  if (!fs.existsSync(pidFile)) return;

  const { backendPid, frontendPid } = JSON.parse(fs.readFileSync(pidFile, 'utf8'));
  try { process.kill(backendPid); } catch (_) {}
  try { process.kill(frontendPid); } catch (_) {}
  fs.unlinkSync(pidFile);
};
