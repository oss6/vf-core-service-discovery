import { zipMap } from '../helpers';
import { ComponentConfig, DiscoveryItemStep03, DiscoveryItemStep04 } from '../types';
import ApiService from '../services/api';
import LoggerService from '../services/logger';

async function getComponentConfig(discoveryItem: DiscoveryItemStep03): Promise<ComponentConfig> {
  const apiService = ApiService.getInstance();
  const name = discoveryItem.nameWithoutPrefix;

  return await apiService.getComponentConfig(name);
}

export default async function extendWithComponentConfig(
  discoveryItems: DiscoveryItemStep03[],
): Promise<DiscoveryItemStep04[]> {
  const loggerService = LoggerService.getInstance();
  const logger = loggerService.getLogger();

  logger.debug('Retrieving lastest packages configuration');

  const configs = await Promise.all(discoveryItems.map(getComponentConfig));

  const processedDiscoveryItems: DiscoveryItemStep04[] = zipMap(
    (discoveryItem, config) =>
      ({
        ...discoveryItem,
        config,
      } as DiscoveryItemStep04),
    discoveryItems,
    configs,
  );

  return processedDiscoveryItems;
}
