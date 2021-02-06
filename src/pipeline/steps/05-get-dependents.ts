import fs from 'fs';
import { glob } from 'glob';
import path from 'path';
import { promisify } from 'util';
import { AppError } from '../../errors';
import { PDiscoveryItem, PipelineContext } from '../../types';

const globP = promisify(glob);

// TODO: should optimise (this is a very naive implementation to demonstrate the concept)
export default async function getDependents(
  discoveryItem: PDiscoveryItem,
  context: PipelineContext,
): Promise<PDiscoveryItem> {
  const processedDiscoveryItem: PDiscoveryItem = { ...discoveryItem, dependents: [] };

  // TODO: consider other patterns (e.g. templates in .ts files in Angular)
  try {
    const matches = await globP(context.rootDirectory + '/**/*.html', { ignore: 'node_modules' });

    for (const filePath of matches) {
      const html = await fs.promises.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath);

      if (html.match(new RegExp(`${discoveryItem.nameWithoutPrefix}`, 'g'))) {
        processedDiscoveryItem.dependents?.push(fileName);
      }
    }

    return processedDiscoveryItem;
  } catch (error) {
    throw new AppError('An error has occurred when searching for dependents.');
  }
}
