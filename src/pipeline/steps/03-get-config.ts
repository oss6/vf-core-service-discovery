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

  const config = await apiService.getComponentConfig(discoveryItem.nameWithoutPrefix);

  return {
    ...discoveryItem,
    config,
  };
}
