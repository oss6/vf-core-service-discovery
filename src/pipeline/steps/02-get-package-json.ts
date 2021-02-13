import ApiService from '../../services/api';
import LoggerService from '../../services/logger';
import { AppError } from '../../errors';
import { PipelineContext, PipelineItem } from '../../types';
import { runAndMeasure } from '../../helpers/misc';
import OptionsService from '../../services/options';

/**
 * Returns the package.json of the latest version of the component.
 * @param pipelineItem The pipeline item to process.
 */
export default async function getPackageJson(
  { discoveryItem, profilingInformation }: PipelineItem,
  context: PipelineContext,
): Promise<PipelineItem> {
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
    async () => apiService.getComponentPackageJson(discoveryItem.nameWithoutPrefix as string, context),
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
