import fs from 'fs';
import { glob } from 'glob';
import path from 'path';
import { promisify } from 'util';
import getContext from '../../context';
import { AppError } from '../../errors';
import { DiscoveryItem } from '../../types';

const globP = promisify(glob);

// TODO: should optimise (this is a very naive implementation to demonstrate the concept)
export default async function getDependents(discoveryItem: Partial<DiscoveryItem>): Promise<Partial<DiscoveryItem>> {
  // const discoveryItems: DiscoveryItem[] = ds.map((d) => ({ ...d, dependents: [] }));
  const processedDiscoveryItem: Partial<DiscoveryItem> = { ...discoveryItem, dependents: [] };
  const context = getContext();

  // TODO: consider other patterns (e.g. templates in .ts files in Angular)
  try {
    const matches = await globP(context.rootDirectory + '/**/*.html', { ignore: 'node_modules' });

    for (const filePath of matches) {
      const html = fs.readFileSync(filePath, 'utf-8');
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
