import { existsSync, rmSync, renameSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const apiDir = 'src/app/api';
const disabledApiDir = 'src/app/_api-disabled';
const shouldCapacitorBuild = process.env.MOBILE_EXPORT === '1' || process.env.MOBILE_EXPORT === 'true' || process.env.CAPACITOR_BUILD === '1' || process.env.CAPACITOR_BUILD === 'true';

function moveIfExists(from, to) {
  if (existsSync(from)) {
    if (existsSync(to)) {
      rmSync(to, { recursive: true, force: true });
    }
    renameSync(from, to);
    return true;
  }
  return false;
}

function restoreIfExists(from, to) {
  if (existsSync(from)) {
    if (existsSync(to)) {
      rmSync(to, { recursive: true, force: true });
    }
    renameSync(from, to);
  }
}

const apiHidden = shouldCapacitorBuild && moveIfExists(apiDir, disabledApiDir);

try {
  const childEnv = {
    ...process.env,
    MOBILE_EXPORT: '1',
  };

  const result = spawnSync('next', ['build', '--webpack'], {
    stdio: 'inherit',
    env: childEnv,
    shell: true,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
} finally {
  if (apiHidden) {
    restoreIfExists(disabledApiDir, apiDir);
  }
}