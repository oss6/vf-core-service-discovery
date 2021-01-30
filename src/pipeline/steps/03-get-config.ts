import ApiService from '../../services/api';
import LoggerService from '../../services/logger';
import { AppError } from '../../errors';
import { PDiscoveryItem } from '../../types';

export default async function getConfig(discoveryItem: PDiscoveryItem): Promise<PDiscoveryItem> {
  if (!discoveryItem.nameWithoutPrefix) {
    throw new AppError('Package name not defined, hence could not get component config.');
  }

  const loggerService = LoggerService.getInstance();
  const logger = loggerService.getLogger();
  const apiService = ApiService.getInstance();

  logger.debug(`${discoveryItem.nameWithoutPrefix} - retrieving package configuration`);

  try {
    const yamlConfig = await apiService.getYamlComponentConfig(discoveryItem.nameWithoutPrefix);

    if (yamlConfig) {
      return {
        ...discoveryItem,
        config: yamlConfig,
      };
    }

    const jsConfig = await apiService.getJsComponentConfig(discoveryItem.nameWithoutPrefix);

    if (jsConfig) {
      return {
        ...discoveryItem,
        config: jsConfig,
      };
    }

    throw new AppError(`${discoveryItem.nameWithoutPrefix} - could not find a configuration file`);
  } catch (error) {
    return discoveryItem;
  }
}
