import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { FileNotFoundError } from '../errors';

export interface LockItem {
  version: string;
  resolved: string;
  integrity: string;
  dev?: boolean;
  dependencies?: object;
  requires?: object;
}

export interface LockObject {
  [pkg: string]: LockItem;
}

export default function (rootDirectory: string): LockObject {
  const npmLockFileName = path.join(rootDirectory, 'package-lock.json');

  if (fs.existsSync(npmLockFileName)) {
    const npmLockFile = JSON.parse(fs.readFileSync(npmLockFileName, 'utf-8'));

    return npmLockFile.dependencies as LockObject;
  }

  const yarnLockFileName = path.join(rootDirectory, 'yarn.lock');

  if (fs.existsSync(yarnLockFileName)) {
    const yarnLockFile: LockObject =  yaml.parse(fs.readFileSync(yarnLockFileName, 'utf-8'))

    return yarnLockFile;
  }

  throw new FileNotFoundError(`${npmLockFileName} and ${yarnLockFileName}`);
}
