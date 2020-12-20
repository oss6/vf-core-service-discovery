import { zipMap } from '../helpers';
import { getLogger } from '../logger';
import { ComponentConfig, DiscoveryItem } from '../types';
import ApiService from '../services/api';

async function getComponentConfig(discoveryItem: DiscoveryItem): Promise<ComponentConfig> {
  const apiService = ApiService.getInstance();
  const name = discoveryItem.nameWithoutPrefix;

  return await apiService.getComponentConfig(name);
}

export default async function extendWithComponentConfig(discoveryItems: DiscoveryItem[]): Promise<DiscoveryItem[]> {
  const logger = getLogger();

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
