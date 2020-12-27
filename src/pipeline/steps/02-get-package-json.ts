import ApiService from '../../services/api';
import LoggerService from '../../services/logger';
import { AppError } from '../../errors';
import { PDiscoveryItem } from '../../types';

export default async function getPackageJson(discoveryItem: PDiscoveryItem): Promise<PDiscoveryItem> {
  if (!discoveryItem.nameWithoutPrefix) {
    throw new AppError('Package name not defined, hence could not get package.json.');
  }

  const loggerService = LoggerService.getInstance();
  const logger = loggerService.getLogger();
  const apiService = ApiService.getInstance();

  logger.debug(`${discoveryItem.nameWithoutPrefix} - retrieving latest package information`);

  const packageJson = await apiService.getComponentPackageJson(discoveryItem.nameWithoutPrefix);

  return {
    ...discoveryItem,
    packageJson,
  };
}
