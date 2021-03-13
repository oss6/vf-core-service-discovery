import fs from 'fs';
import path from 'path';
import { FileNotFoundError, NoVfDependenciesFoundError } from '../../errors';
import LoggerService from '../../services/logger';
import { PipelineContext } from '../../types';

/**
 * Returns the components used by the project.
 * @param context The pipeline context.
 */
export default async function getComponents(context: PipelineContext): Promise<string[]> {
  const loggerService = LoggerService.getInstance();

  loggerService.log('debug', 'Retrieving components from package.json', getComponents);

  const packageJsonFile = path.join(context.rootDirectory, 'package.json');

  try {
    context.packageJson = JSON.parse(await fs.promises.readFile(packageJsonFile, 'utf-8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new FileNotFoundError(packageJsonFile);
    }

    throw error;
  }

  const dependencies: string[] = Object.keys(context.packageJson?.dependencies || {}).filter((dep) =>
    dep.startsWith(context.vfPackagePrefix),
  );

  const devDependencies: string[] = Object.keys(context.packageJson?.devDependencies || {}).filter((dep) =>
    dep.startsWith(context.vfPackagePrefix),
  );

  const components: string[] = [...dependencies, ...devDependencies];

  if (components.length === 0) {
    throw new NoVfDependenciesFoundError(packageJsonFile);
  }

  // TODO: fix vf-form once multi-components are supported
  const ignoredPackages = ['vf-form', 'vf-core', 'vf-config', 'vf-extensions'];
  return Promise.resolve(components.filter((c) => ignoredPackages.every((ignored) => !c.includes(ignored))));
}
