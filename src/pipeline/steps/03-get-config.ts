import ApiService from '../../services/api';
import LoggerService from '../../services/logger';
import { AppError } from '../../errors';
import { PipelineContext, PipelineItem } from '../../types';
import { runAndMeasure } from '../../helpers/misc';
import OptionsService from '../../services/options';

/**
 * Returns the configuration of the vf-core component.
 * @param pipelineItem The pipeline item to process.
 */
export default async function getConfig(
  { discoveryItem, profilingInformation }: PipelineItem,
  context: PipelineContext,
): Promise<PipelineItem> {
  if (!discoveryItem.nameWithoutPrefix) {
    throw new AppError('Package name not defined, hence could not get component config.');
  }

  const loggerService = LoggerService.getInstance();
  const logger = loggerService.getLogger();
  const apiService = ApiService.getInstance();
  const optionsService = OptionsService.getInstance();
  const { profile } = optionsService.getOptions();

  logger.debug(`${discoveryItem.nameWithoutPrefix} - retrieving package configuration`);

  const { result: yamlConfig, took: yamlConfigResponseTime } = await runAndMeasure(
    async () => apiService.getYamlComponentConfig(discoveryItem.nameWithoutPrefix as string, context),
    profile,
  );

  if (yamlConfig) {
    return {
      discoveryItem: {
        ...discoveryItem,
        config: yamlConfig,
      },
      profilingInformation: {
        ...profilingInformation,
        getConfig: yamlConfigResponseTime,
      },
    };
  }

  const { result: jsConfig, took: jsConfigResponseTime } = await runAndMeasure(
    async () => apiService.getJsComponentConfig(discoveryItem.nameWithoutPrefix as string, context),
    profile,
  );

  if (jsConfig) {
    return {
      discoveryItem: {
        ...discoveryItem,
        config: jsConfig,
      },
      profilingInformation: {
        ...profilingInformation,
        getConfig: jsConfigResponseTime,
      },
    };
  }

  throw new AppError(`${discoveryItem.nameWithoutPrefix} - could not find a configuration file`);
}
