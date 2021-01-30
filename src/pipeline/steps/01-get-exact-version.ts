import fs from 'fs';
import path from 'path';
import { parse as parseYarnLockFile } from '@yarnpkg/lockfile';
import { LockObject, PDiscoveryItem, PipelineContext } from '../../types';
import { AppError, FileNotFoundError } from '../../errors';
import LoggerService from '../../services/logger';

export async function parseLockFile(rootDirectory: string): Promise<LockObject> {
  const npmLockFileName = path.join(rootDirectory, 'package-lock.json');

  try {
    const npmLockFile = JSON.parse(await fs.promises.readFile(npmLockFileName, 'utf-8'));

    return npmLockFile.dependencies as LockObject;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  const yarnLockFileName = path.join(rootDirectory, 'yarn.lock');

  try {
    const yarnLockFile: LockObject = parseYarnLockFile(await fs.promises.readFile(yarnLockFileName, 'utf-8')).object;

    return Object.entries(yarnLockFile).reduce(
      (obj, [pkg, lockItem]) => ({
        ...obj,
        [pkg.split('@').slice(0, -1).join('@')]: lockItem,
      }),
      {},
    );
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  throw new FileNotFoundError(`${npmLockFileName} and ${yarnLockFileName}`);
}

export default async function getExactVersion(
  discoveryItem: PDiscoveryItem,
  context: PipelineContext,
): Promise<PDiscoveryItem> {
  if (!discoveryItem.name || !discoveryItem.nameWithoutPrefix) {
    throw new AppError('Package name not defined, hence could not get exact version.');
  }

  const loggerService = LoggerService.getInstance();
  const logger = loggerService.getLogger();

  logger.debug(`${discoveryItem.nameWithoutPrefix} - retrieving exact version`);

  const lockObject: LockObject = await parseLockFile(context.rootDirectory);

  if (!lockObject[discoveryItem.name]) {
    throw new AppError(`${discoveryItem.nameWithoutPrefix} - could not retrieve exact version`);
  }

  return Promise.resolve({
    ...discoveryItem,
    version: lockObject[discoveryItem.name].version,
  });
}
