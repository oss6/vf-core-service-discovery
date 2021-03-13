import fs from 'fs';
import path from 'path';
import { AppError } from '../../errors';
import { runAndMeasure } from '../../helpers/misc';
import LoggerService from '../../services/logger';
import OptionsService from '../../services/options';
import { PDiscoveryItem, PipelineContext, PipelineItem } from '../../types';

/**
 * Returns the dependents of the component.
 * @param pipelineItem The pipeline item to process.
 * @param context The pipeline context.
 */
export default async function getDependents(
  { discoveryItem, profilingInformation }: PipelineItem,
  context: PipelineContext,
): Promise<PipelineItem> {
  try {
    const loggerService = LoggerService.getInstance();

    loggerService.log(
      'debug',
      {
        message: 'Getting dependents',
        details: { component: discoveryItem.nameWithoutPrefix },
      },
      getDependents,
    );

    const optionsService = OptionsService.getInstance();
    const { profile } = optionsService.getOptions();

    const { result: processedDiscoveryItem, took } = await runAndMeasure(async () => {
      const processedDiscoveryItem: PDiscoveryItem = { ...discoveryItem, dependents: [] };

      for (const { filePath, matcher } of context.potentialDependents) {
        const contents = await fs.promises.readFile(filePath, 'utf-8');
        const fileName = path.basename(filePath);

        if (matcher(processedDiscoveryItem, contents)) {
          processedDiscoveryItem.dependents?.push(fileName);
        }
      }

      return processedDiscoveryItem;
    }, profile);

    return {
      discoveryItem: processedDiscoveryItem,
      profilingInformation: {
        ...profilingInformation,
        getDependents: took,
      },
    };
  } catch (error) {
    throw new AppError('An error has occurred when searching for dependents.');
  }
}
