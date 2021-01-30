import fs from 'fs';
import path from 'path';
import { FileNotFoundError, NoVfDependenciesFoundError } from '../../errors';
import LoggerService from '../../services/logger';
import { PackageJson, PipelineContext } from '../../types';

export default async function getComponents(context: PipelineContext): Promise<string[]> {
  const loggerService = LoggerService.getInstance();
  const logger = loggerService.getLogger();

  logger.debug('Retrieving components from package.json');

  const packageJsonFile = path.join(context.rootDirectory, 'package.json');

  let packageJson: PackageJson;

  try {
    packageJson = JSON.parse(await fs.promises.readFile(packageJsonFile, 'utf-8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new FileNotFoundError(packageJsonFile);
    }

    throw error;
  }

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
