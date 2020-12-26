import { zipMap } from '../helpers';
import ApiService from '../services/api';
import LoggerService from '../services/logger';
import { DiscoveryItemStep02, DiscoveryItemStep03, PackageJson } from '../types';

async function getComponentPackageJson(discoveryItem: DiscoveryItemStep02): Promise<PackageJson> {
  const apiService = ApiService.getInstance();
  const name = discoveryItem.nameWithoutPrefix;

  return await apiService.getComponentPackageJson(name);
}

export default async function extendWithComponentPackageJson(
  discoveryItems: DiscoveryItemStep02[],
): Promise<DiscoveryItemStep03[]> {
  const loggerService = LoggerService.getInstance();
  const logger = loggerService.getLogger();

  logger.debug('Retrieving latest packages information');

  const packages = await Promise.all(discoveryItems.map(getComponentPackageJson));

  const processedDiscoveryItems: DiscoveryItemStep03[] = zipMap(
    (discoveryItem, packageJson) => ({
      ...discoveryItem,
      packageJson,
    }),
    discoveryItems,
    packages,
  );

  return processedDiscoveryItems;
}
