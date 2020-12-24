import fs from 'fs';
import path from 'path';
import { asyncFlow } from './helpers';
import { DiscoveryItem, Options } from './types';
import ConfigurationService from './services/configuration';
import OptionsService from './services/options';
import LoggerService from './services/logger';
import ApiService from './services/api';

export default async function runServiceDiscovery(options: Options): Promise<DiscoveryItem[]> {
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

  const pipeline = await Promise.all(
    fs
      .readdirSync(path.join(__dirname, 'pipeline'))
      .filter((fileName) => fileName.endsWith('.js'))
      .map(async (fileName) => (await import(`./pipeline/${fileName}`)).default),
  );

  const discoveryItems = (await asyncFlow(...pipeline)) as DiscoveryItem[];

  return discoveryItems;
}
