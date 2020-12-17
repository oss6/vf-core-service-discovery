import fs from 'fs';
import yaml from 'yaml';
import { getVfCoreRepository } from '../helpers';
import { getLogger } from '../logger';
import { ComponentConfig, DiscoveryItem } from '../types';

function getComponentConfig(discoveryItem: DiscoveryItem): ComponentConfig {
  const name = discoveryItem.nameWithoutPrefix;
  const yamlConfigFileName = getVfCoreRepository('components', name, `${name}.config.yml`);

  if (fs.existsSync(yamlConfigFileName)) {
    return yaml.parse(fs.readFileSync(yamlConfigFileName, 'utf-8'));
  }

  const moduleConfigFileName = getVfCoreRepository('components', name, `${name}.config.js`);
  return require(moduleConfigFileName);
}

export default function extendWithComponentConfig(discoveryItems: DiscoveryItem[]): Promise<DiscoveryItem[]> {
  return new Promise<DiscoveryItem[]>((resolve) => {
    const logger = getLogger();

    logger.debug('Retrieving lastest packages configuration');

    const processedDiscoveryItems = discoveryItems.map((discoveryItem) => ({
      ...discoveryItem,
      config: getComponentConfig(discoveryItem),
    }));

    resolve(processedDiscoveryItems);
  });
}
