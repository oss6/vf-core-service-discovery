import { DiscoveryItem, Options } from './types';
import ConfigurationService from './services/configuration';
import OptionsService from './services/options';
import LoggerService from './services/logger';
import ApiService from './services/api';
import { Pipeline } from './pipeline';
import getComponents from './pipeline/steps/00-get-components';
import getExactVersion from './pipeline/steps/01-get-exact-version';
import getPackageJson from './pipeline/steps/02-get-package-json';
import getConfig from './pipeline/steps/03-get-config';
import getChangelog from './pipeline/steps/04-get-changelog';
import getDependents from './pipeline/steps/05-get-dependents';

export default async function runServiceDiscovery(options: Options): Promise<Partial<DiscoveryItem>[]> {
  const optionsService = OptionsService.getInstance();
  const configurationService = ConfigurationService.getInstance();
  const loggerService = LoggerService.getInstance();
  const apiService = ApiService.getInstance();
  const logger = loggerService.getLogger();

  optionsService.setOptions(options);
  await configurationService.setup();

  if (options.forceRun || configurationService.shouldInvalidate()) {
    await configurationService.deleteCachedComponents();
    configurationService.update('lastInvalidation', new Date());
  }

  if (!configurationService.config.gitHubAccessToken || options.forceGitHubAuth) {
    const gitHubAccessToken = await apiService.authenticateGitHub();
    configurationService.update('gitHubAccessToken', gitHubAccessToken);
  }

  if (!configurationService.config.vfCoreVersion || options.forceRun) {
    const vfCoreVersion = await apiService.getVfCoreLatestReleaseVersion();
    configurationService.update('vfCoreVersion', vfCoreVersion);
  }

  logger.debug('Running service discovery');

  const components = await getComponents();

  return Pipeline.getInstance()
    .addStep(getExactVersion)
    .addStep(getPackageJson)
    .addStep(getConfig)
    .addStep(getChangelog)
    .addStep(getDependents)
    .run(components);
}
