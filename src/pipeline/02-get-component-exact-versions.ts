import fs from 'fs';
import path from 'path';
import { parse as parseYarnLockFile } from '@yarnpkg/lockfile';
import getContext from '../context';
import { DiscoveryItem, LockObject } from '../types';
import { FileNotFoundError } from '../errors';
import LoggerService from '../services/logger';

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

export default function getComponentsExactVersion(components: string[]): Promise<DiscoveryItem[]> {
  return new Promise<DiscoveryItem[]>((resolve) => {
    const loggerService = LoggerService.getInstance();
    const logger = loggerService.getLogger();
    const context = getContext();

    logger.debug('Retrieving the exact versions for each component');

    const componentsMap: { [name: string]: string } = {};
    const lockObject: LockObject = parseLockFile(context.rootDirectory);

    for (const component of components) {
      if (lockObject[component]) {
        componentsMap[component] = lockObject[component].version;
      }
    }

    const discoveryItems = Object.entries(componentsMap).map(
      ([component, version]) =>
        ({
          name: component,
          nameWithoutPrefix: component.replace(`${context.vfPackagePrefix}/`, ''),
          version,
        } as DiscoveryItem),
    );

    resolve(discoveryItems);
  });
}
