import fs from 'fs';
import path from 'path';
import { parse as parseYarnLockFile } from '@yarnpkg/lockfile';
import { FileNotFoundError } from './errors';
import { LockObject } from './types';

export default function (rootDirectory: string): LockObject {
  const npmLockFileName = path.join(rootDirectory, 'package-lock.json');

  if (fs.existsSync(npmLockFileName)) {
    const npmLockFile = JSON.parse(fs.readFileSync(npmLockFileName, 'utf-8'));

    return npmLockFile.dependencies as LockObject;
  }

  const yarnLockFileName = path.join(rootDirectory, 'yarn.lock');

  if (fs.existsSync(yarnLockFileName)) {
    const yarnLockFile: LockObject = parseYarnLockFile(fs.readFileSync(yarnLockFileName, 'utf-8')).object;

    return Object.entries(yarnLockFile).reduce((obj, [pkg, lockItem]) => ({
      ...obj,
      [pkg.split('@').slice(0, -1).join('@')]: lockItem
    }), {});
  }

  throw new FileNotFoundError(`${npmLockFileName} and ${yarnLockFileName}`);
}
