import fs from 'fs';
import path from 'path';
import { PackageJson } from './core/definitions';
import { FileNotFoundError, NoVfDependenciesFoundError } from './errors';
import parseLockFile, { LockObject } from './core/parse-lock-file';

export interface ComponentsMap {
  [name: string]: string;
}

const VF_PACKAGE_PREFIX = '@visual-framework';

function getVfComponentsInPackageJson(rootDirectory: string): string[] {
  const packageJsonFile = path.join(rootDirectory, 'package.json');

  if (!fs.existsSync(packageJsonFile)) {
    throw new FileNotFoundError(packageJsonFile);
  }

  const packageJson: PackageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf-8'));

  const dependencies: string[] = Object.keys(packageJson.dependencies || {}).filter(dep => dep.startsWith(VF_PACKAGE_PREFIX));
  const devDependencies: string[] = Object.keys(packageJson.devDependencies || {}).filter(dep => dep.startsWith(VF_PACKAGE_PREFIX));

  const components: string[] = [...dependencies, ...devDependencies];

  if (components.length === 0) {
    throw new NoVfDependenciesFoundError(packageJsonFile);
  }

  return components;
}

function getVfComponentExactVersions(rootDirectory: string, components: string[]): ComponentsMap {
  const componentsMap: ComponentsMap = {};
  const lockObject: LockObject = parseLockFile(rootDirectory);

  for (const component of components) {
    if (lockObject[component]) {
      componentsMap[component] = lockObject[component].version;
    }
  }

  return componentsMap;
}

export default function (rootDirectory: string) {
  const components = getVfComponentsInPackageJson(rootDirectory);
  const componentsMap = getVfComponentExactVersions(rootDirectory, components);

  return componentsMap;
}
