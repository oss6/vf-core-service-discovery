import flow from 'lodash/flow';
import { createAppDirectoryIfNotExistent, getAppDirectory, shouldInvalidate, updateLastInvalidation } from './app-config';
import { DiscoveryItem } from './definitions';
import { cloneRepository } from './git-client';
import { getLogger } from './logger';
import { getComponentsFromPackageJson, getComponentsExactVersion, extendWithComponentPackageJson, extendWithComponentConfig, extendWithCumulativeChangelog, extendWithComponentsDependents } from './service-discovery';

export async function discover(): Promise<DiscoveryItem[]> {
  const appConfig = createAppDirectoryIfNotExistent();
  const logger = getLogger();

  logger.debug('App configuration loaded successfully');

  if (shouldInvalidate(appConfig)) {
    logger.debug('Started invalidation');

    await cloneRepository('https://github.com/visual-framework/vf-core.git', getAppDirectory('vf-core'));

    logger.debug('vf-core cloned successfully');

    updateLastInvalidation({
      ...appConfig,
      lastInvalidation: new Date()
    });
  }

  logger.debug('Running service discovery');

  const run = flow(
    getComponentsFromPackageJson,
    getComponentsExactVersion,
    extendWithComponentPackageJson(),
    extendWithComponentConfig(),
    extendWithCumulativeChangelog()
  );

  let discoveryItems = run();

  discoveryItems = await extendWithComponentsDependents(discoveryItems);

  return discoveryItems;
}
