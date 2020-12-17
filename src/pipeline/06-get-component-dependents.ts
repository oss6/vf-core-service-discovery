import fs from 'fs';
import { glob } from 'glob';
import path from 'path';
import getContext from '../context';
import { AppError } from '../errors';
import { DiscoveryItem } from '../types';

// TODO: should optimise (this is a very naive implementation to demonstrate the concept)
export default function extendWithComponentsDependents(ds: DiscoveryItem[]): Promise<DiscoveryItem[]> {
  return new Promise((resolve, reject) => {
    const discoveryItems = [...ds];
    const context = getContext();

    // TODO: consider other patterns (e.g. templates in .ts files in Angular)
    glob(context.rootDirectory + '/**/*.html', { ignore: 'node_modules' }, (error, matches) => {
      if (error) {
        reject(new AppError('An error has occurred when searching for dependents.'));
      }

      for (const filePath of matches) {
        const html = fs.readFileSync(filePath, 'utf-8');

        for (const discoveryItem of discoveryItems) {
          const fileName = path.basename(filePath);

          if (html.match(new RegExp(`${discoveryItem.nameWithoutPrefix}`, 'g'))) {
            discoveryItem.dependents = discoveryItem.dependents ? [...discoveryItem.dependents, fileName] : [fileName];
          }
        }
      }

      resolve(discoveryItems);
    });
  });
}
