import fs from 'fs';
import { getVfCoreRepository } from '../helpers';
import { getLogger } from '../logger';
import { DiscoveryItem, PackageJson } from '../types';

function getComponentPackageJson(discoveryItem: DiscoveryItem): PackageJson {
  const name = discoveryItem.nameWithoutPrefix;
  const packageJsonFileName = getVfCoreRepository('components', name, 'package.json');

  return JSON.parse(fs.readFileSync(packageJsonFileName, 'utf-8'));
}

export default function extendWithComponentPackageJson(discoveryItems: DiscoveryItem[]): Promise<DiscoveryItem[]> {
  return new Promise<DiscoveryItem[]>((resolve) => {
    const logger = getLogger();

    logger.debug('Retrieving latest packages information');

    const processedDiscoveryItems = discoveryItems.map((discoveryItem) => ({
      ...discoveryItem,
      packageJson: getComponentPackageJson(discoveryItem),
    }));

    resolve(processedDiscoveryItems);
  });
}
