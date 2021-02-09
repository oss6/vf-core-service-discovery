import fs from 'fs';
import { glob } from 'glob';
import path from 'path';
import { promisify } from 'util';
import { AppError } from '../../errors';
import { runAndMeasure } from '../../helpers';
import OptionsService from '../../services/options';
import { PDiscoveryItem, PipelineContext, PipelineItem } from '../../types';

const globP = promisify(glob);

// TODO: should optimise (this is a very naive implementation to demonstrate the concept)
/**
 * Returns the dependents of the component.
 * @param pipelineItem The pipeline item to process.
 * @param context The pipeline context.
 */
export default async function getDependents(
  { discoveryItem, profilingInformation }: PipelineItem,
  context: PipelineContext,
): Promise<PipelineItem> {
  // TODO: consider other patterns (e.g. templates in .ts files in Angular)
  try {
    const optionsService = OptionsService.getInstance();
    const { profile } = optionsService.getOptions();

    const { result: processedDiscoveryItem, took } = await runAndMeasure(async () => {
      const processedDiscoveryItem: PDiscoveryItem = { ...discoveryItem, dependents: [] };
      const matches = await globP(context.rootDirectory + '/**/*.html', { ignore: 'node_modules' });

      for (const filePath of matches) {
        const html = await fs.promises.readFile(filePath, 'utf-8');
        const fileName = path.basename(filePath);

        if (html.match(new RegExp(`${discoveryItem.nameWithoutPrefix}`, 'g'))) {
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
