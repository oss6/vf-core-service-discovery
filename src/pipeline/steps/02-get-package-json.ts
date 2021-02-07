import ApiService from '../../services/api';
import LoggerService from '../../services/logger';
import { AppError } from '../../errors';
import { PipelineItem } from '../../types';
import { runAndMeasure } from '../../helpers';
import OptionsService from '../../services/options';

export default async function getPackageJson({
  discoveryItem,
  profilingInformation,
}: PipelineItem): Promise<PipelineItem> {
  if (!discoveryItem.nameWithoutPrefix) {
    throw new AppError('Package name not defined, hence could not get package.json.');
  }

  const loggerService = LoggerService.getInstance();
  const logger = loggerService.getLogger();
  const apiService = ApiService.getInstance();
  const optionsService = OptionsService.getInstance();
  const { profile } = optionsService.getOptions();

  logger.debug(`${discoveryItem.nameWithoutPrefix} - retrieving latest package information`);

  const { result, took } = await runAndMeasure(
    async () => apiService.getComponentPackageJson(discoveryItem.nameWithoutPrefix as string),
    profile,
  );

  return {
    discoveryItem: {
      ...discoveryItem,
      packageJson: result,
    },
    profilingInformation: {
      ...profilingInformation,
      getPackageJson: took,
    },
  };
}
