import fs from 'fs';
import path from 'path';
import { parse as parseYarnLockFile } from '@yarnpkg/lockfile';
import { DiscoveryItem, LockObject, PipelineContext, PipelineItem } from '../../types';
import { AppError, FileNotFoundError } from '../../errors';
import LoggerService from '../../services/logger';
import OptionsService from '../../services/options';
import { runAndMeasure } from '../../helpers/misc';

export async function parseLockFile(rootDirectory: string): Promise<LockObject> {
  const npmLockFileName = path.join(rootDirectory, 'package-lock.json');

  try {
    const npmLockFile = JSON.parse(await fs.promises.readFile(npmLockFileName, 'utf-8'));
    const fullLockObject = npmLockFile.dependencies as LockObject;

    return Object.entries(fullLockObject)
      .filter(([pkg, _]) => pkg.includes('visual-framework'))
      .reduce(
        (obj, [pkg, lockItem]) => ({
          ...obj,
          [pkg]: lockItem,
        }),
        {},
      );
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  const yarnLockFileName = path.join(rootDirectory, 'yarn.lock');

  try {
    const yarnLockFile: LockObject = parseYarnLockFile(await fs.promises.readFile(yarnLockFileName, 'utf-8')).object;

    return Object.entries(yarnLockFile)
      .filter(([pkg, _]) => pkg.includes('visual-framework'))
      .reduce(
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

export async function extractVersion(discoveryItem: DiscoveryItem, context: PipelineContext): Promise<string> {
  const loggerService = LoggerService.getInstance();
  const logger = loggerService.getLogger();
  const optionsService = OptionsService.getInstance();
  const options = optionsService.getOptions();
  const parse = async (): Promise<string> => {
    logger.debug(`${discoveryItem.nameWithoutPrefix} - retrieving exact version from remote`);

    const lockObject = await parseLockFile(context.rootDirectory);
    context.cache.lockObjects[context.rootDirectory] = lockObject;

    if (!lockObject[discoveryItem.name]) {
      throw new AppError(`${discoveryItem.nameWithoutPrefix} - could not retrieve exact version`);
    }

    return lockObject[discoveryItem.name].version;
  };

  if (options.forceRun) {
    return await parse();
  }

  const lockObject = context.cache.lockObjects[context.rootDirectory];

  if (lockObject && lockObject[discoveryItem.name]) {
    return lockObject[discoveryItem.name].version;
  } else {
    return await parse();
  }
}

/**
 * Returns the exact version of the installed component.
 * @param pipelineItem The pipeline item to process.
 * @param context The pipeline context.
 */
export default async function getExactVersion(
  { discoveryItem, profilingInformation }: PipelineItem,
  context: PipelineContext,
): Promise<PipelineItem> {
  if (!discoveryItem.name || !discoveryItem.nameWithoutPrefix) {
    throw new AppError('Package name not defined, hence could not get exact version.');
  }

  const optionsService = OptionsService.getInstance();
  const { profile } = optionsService.getOptions();
  const { result, took } = await runAndMeasure(
    async () => extractVersion(discoveryItem as DiscoveryItem, context),
    profile,
  );

  return Promise.resolve({
    discoveryItem: {
      ...discoveryItem,
      version: result,
    },
    profilingInformation: {
      ...profilingInformation,
      getExactVersion: took,
    },
  });
}
