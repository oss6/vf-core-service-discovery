import fs from 'fs';
import path from 'path';
import { parse as parseYarnLockFile } from '@yarnpkg/lockfile';
import getContext from '../../context';
import { DiscoveryItem, LockObject } from '../../types';
import { AppError, FileNotFoundError } from '../../errors';
import LoggerService from '../../services/logger';

export function parseLockFile(rootDirectory: string): LockObject {
  const npmLockFileName = path.join(rootDirectory, 'package-lock.json');

  if (fs.existsSync(npmLockFileName)) {
    const npmLockFile = JSON.parse(fs.readFileSync(npmLockFileName, 'utf-8'));

    return npmLockFile.dependencies as LockObject;
  }

  const yarnLockFileName = path.join(rootDirectory, 'yarn.lock');

  if (fs.existsSync(yarnLockFileName)) {
    const yarnLockFile: LockObject = parseYarnLockFile(fs.readFileSync(yarnLockFileName, 'utf-8')).object;

    return Object.entries(yarnLockFile).reduce(
      (obj, [pkg, lockItem]) => ({
        ...obj,
        [pkg.split('@').slice(0, -1).join('@')]: lockItem,
      }),
      {},
    );
  }

  throw new FileNotFoundError(`${npmLockFileName} and ${yarnLockFileName}`);
}

export default function getExactVersion(discoveryItem: Partial<DiscoveryItem>): Promise<Partial<DiscoveryItem>> {
  if (!discoveryItem.name || !discoveryItem.nameWithoutPrefix) {
    throw new AppError('Package name not defined, hence could not get exact version.');
  }

  const loggerService = LoggerService.getInstance();
  const logger = loggerService.getLogger();
  const context = getContext();

  logger.debug(`${discoveryItem.nameWithoutPrefix} - retrieving exact version`);

  const lockObject: LockObject = parseLockFile(context.rootDirectory);

  if (!lockObject[discoveryItem.name]) {
    throw new AppError(`${discoveryItem.nameWithoutPrefix} - could not retrieve exact version`);
  }

  return Promise.resolve({
    ...discoveryItem,
    version: lockObject[discoveryItem.name].version,
  });
}
