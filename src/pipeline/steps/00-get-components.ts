import fs from 'fs';
import path from 'path';
import getContext from '../../context';
import { FileNotFoundError, NoVfDependenciesFoundError } from '../../errors';
import LoggerService from '../../services/logger';
import { PackageJson } from '../../types';

export default async function getComponents(): Promise<string[]> {
  const loggerService = LoggerService.getInstance();
  const logger = loggerService.getLogger();
  const context = getContext();

  logger.debug('Retrieving components from package.json');

  const packageJsonFile = path.join(context.rootDirectory, 'package.json');

  if (!fs.existsSync(packageJsonFile)) {
    throw new FileNotFoundError(packageJsonFile);
  }

  const packageJson: PackageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf-8'));

  const dependencies: string[] = Object.keys(packageJson.dependencies || {}).filter((dep) =>
    dep.startsWith(context.vfPackagePrefix),
  );

  const devDependencies: string[] = Object.keys(packageJson.devDependencies || {}).filter((dep) =>
    dep.startsWith(context.vfPackagePrefix),
  );

  const components: string[] = [...dependencies, ...devDependencies];

  if (components.length === 0) {
    throw new NoVfDependenciesFoundError(packageJsonFile);
  }

  // TODO: fix this once we know where vf-form is
  return Promise.resolve(components.filter((c) => !c.includes('vf-form')));
}
