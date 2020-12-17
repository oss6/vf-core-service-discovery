import flow from 'lodash/flow';
import { DiscoveryItem, Options } from './types';
import { cloneRepository } from './git-client';
import { getLogger } from './logger';
import { getComponentsFromPackageJson, getComponentsExactVersion, extendWithComponentPackageJson, extendWithComponentConfig, extendWithCumulativeChangelog, extendWithComponentsDependents } from './service-discovery';
import App from './app';

export async function discover(options: Options): Promise<DiscoveryItem[]> {
  const app = App.getInstance(options);
  const logger = getLogger();

  await app.setupConfiguration();

  if (options.forceRun || app.shouldInvalidate()) {
    logger.debug('Started invalidation');

    await cloneRepository('https://github.com/visual-framework/vf-core.git', app.getAppDirectory('vf-core'));

    logger.debug('vf-core cloned successfully');

    app.updateLastInvalidation(new Date());
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
