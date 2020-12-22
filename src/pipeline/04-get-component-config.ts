import { zipMap } from '../helpers';
import { ComponentConfig, DiscoveryItem } from '../types';
import ApiService from '../services/api';
import LoggerService from '../services/logger';

async function getComponentConfig(discoveryItem: DiscoveryItem): Promise<ComponentConfig> {
  const apiService = ApiService.getInstance();
  const name = discoveryItem.nameWithoutPrefix;

  return await apiService.getComponentConfig(name);
}

export default async function extendWithComponentConfig(discoveryItems: DiscoveryItem[]): Promise<DiscoveryItem[]> {
  const loggerService = LoggerService.getInstance();
  const logger = loggerService.getLogger();

  logger.debug('Retrieving lastest packages configuration');

  const configs = await Promise.all(discoveryItems.map(getComponentConfig));

  const processedDiscoveryItems: DiscoveryItem[] = zipMap(
    (discoveryItem, config) =>
      ({
        ...discoveryItem,
        config,
      } as DiscoveryItem),
    discoveryItems,
    configs,
  );

  return processedDiscoveryItems;
}
