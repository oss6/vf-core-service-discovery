import fs from 'fs';
import yaml from 'yaml';
import App from '../app';
import { getLogger } from '../logger';
import { ComponentConfig, DiscoveryItem } from '../types';

function getComponentConfig(discoveryItem: DiscoveryItem): ComponentConfig {
  const app = App.getInstance();
  const name = discoveryItem.nameWithoutPrefix;
  const yamlConfigFileName = app.getVfCoreRepository('components', name, `${name}.config.yml`);

  if (fs.existsSync(yamlConfigFileName)) {
    return yaml.parse(fs.readFileSync(yamlConfigFileName, 'utf-8'));
  }

  const moduleConfigFileName = app.getVfCoreRepository('components', name, `${name}.config.js`);
  return require(moduleConfigFileName);
}

export default function extendWithComponentConfig(discoveryItems: DiscoveryItem[]): Promise<DiscoveryItem[]> {
  return new Promise<DiscoveryItem[]>((resolve, reject) => {
    const logger = getLogger();

    logger.debug('Retrieving lastest packages configuration');

    const processedDiscoveryItems = discoveryItems.map((discoveryItem) => ({
      ...discoveryItem,
      config: getComponentConfig(discoveryItem)
    }));

    resolve(processedDiscoveryItems);
  });
}
