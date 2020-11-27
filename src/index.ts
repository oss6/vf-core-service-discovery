import flow from 'lodash/flow';
import { createAppDirectoryIfNotExistent, getAppDirectory, shouldInvalidate, updateLastInvalidation } from './core/app-config';
import { DiscoveryItem } from './core/definitions';
import { cloneRepository } from './core/git-client';
import { getComponentsFromPackageJson, getComponentsExactVersion, ProcessingContext, extendWithComponentPackageJson, extendWithComponentConfig, extendWithCumulativeChangelog } from './service-discovery';

export async function discover(rootDirectory: string): Promise<DiscoveryItem[]> {
  const appConfig = createAppDirectoryIfNotExistent();

  if (shouldInvalidate(appConfig)) {
    console.log('Cloning vf-core...');

    await cloneRepository('https://github.com/visual-framework/vf-core.git', getAppDirectory('vf-core'));

    updateLastInvalidation({
      ...appConfig,
      lastInvalidation: new Date()
    });
  }

  const context: ProcessingContext = {
    rootDirectory,
    vfPackagePrefix: '@visual-framework'
  };

  const run = flow(
    getComponentsFromPackageJson(context),
    getComponentsExactVersion(context),
    extendWithComponentPackageJson(),
    extendWithComponentConfig(),
    extendWithCumulativeChangelog()
  );

  return run();
}
