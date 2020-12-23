import packageJson from 'package-json';
import { zipMap } from '../helpers';
import ApiService from '../services/api';
import LoggerService from '../services/logger';
import { DiscoveryItem } from '../types';

async function getComponentPackageJson(discoveryItem: DiscoveryItem): Promise<packageJson.AbbreviatedMetadata> {
  const apiService = ApiService.getInstance();
  const name = discoveryItem.nameWithoutPrefix;

  return await apiService.getComponentPackageJson(name);
}

export default async function extendWithComponentPackageJson(
  discoveryItems: DiscoveryItem[],
): Promise<DiscoveryItem[]> {
  const loggerService = LoggerService.getInstance();
  const logger = loggerService.getLogger();

  logger.debug('Retrieving latest packages information');

  const packages = await Promise.all(discoveryItems.map(getComponentPackageJson));

  const processedDiscoveryItems: DiscoveryItem[] = zipMap(
    (discoveryItem, packageJson) => ({
      ...discoveryItem,
      packageJson,
    }),
    discoveryItems,
    packages,
  );

  return processedDiscoveryItems;
}
