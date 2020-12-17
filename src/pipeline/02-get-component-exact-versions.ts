import getContext from '../context';
import { getLogger } from '../logger';
import parseLockFile from '../parse-lock-file';
import { DiscoveryItem, LockObject } from '../types';

export default function getComponentsExactVersion(components: string[]): Promise<DiscoveryItem[]> {
  return new Promise<DiscoveryItem[]>((resolve) => {
    const logger = getLogger();
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
