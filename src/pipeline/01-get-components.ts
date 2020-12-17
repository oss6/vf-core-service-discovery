import fs from 'fs';
import path from 'path';
import getContext from '../context';
import { FileNotFoundError, NoVfDependenciesFoundError } from '../errors';
import { getLogger } from '../logger';
import { PackageJson } from '../types';

export default function getComponentsFromPackageJson(): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    const logger = getLogger();
    const context = getContext();

    logger.debug('Retrieving components from package.json');

    const packageJsonFile = path.join(context.rootDirectory, 'package.json');

    if (!fs.existsSync(packageJsonFile)) {
      reject(new FileNotFoundError(packageJsonFile));
      // throw new FileNotFoundError(packageJsonFile);
    }

    const packageJson: PackageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf-8'));

    const dependencies: string[] = Object.keys(packageJson.dependencies || {}).filter(dep => dep.startsWith(context.vfPackagePrefix));

    const devDependencies: string[] = Object.keys(packageJson.devDependencies || {}).filter(dep => dep.startsWith(context.vfPackagePrefix));

    const components: string[] = [...dependencies, ...devDependencies];

    if (components.length === 0) {
      throw new NoVfDependenciesFoundError(packageJsonFile);
    }

    // TODO: fix this once we know where vf-form is
    resolve(components.filter(c => !c.includes('vf-form')));
  });
}
