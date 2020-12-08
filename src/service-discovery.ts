import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { ChangelogItem, ComponentConfig, DiscoveryItem, PackageJson } from './definitions';
import { FileNotFoundError, NoVfDependenciesFoundError } from './errors';
import parseLockFile, { LockObject } from './parse-lock-file';
import { getVfCoreRepository } from './app-config';
import map from 'lodash/map';
import { getLogger } from './logger';

export interface ProcessingContext {
  rootDirectory: string;
  vfPackagePrefix: string;
}

export function getComponentsFromPackageJson(context: ProcessingContext): () => string[] {
  return () => {
    const logger = getLogger();

    logger.debug('Retrieving components from package.json');

    const packageJsonFile = path.join(context.rootDirectory, 'package.json');

    if (!fs.existsSync(packageJsonFile)) {
      throw new FileNotFoundError(packageJsonFile);
    }

    const packageJson: PackageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf-8'));
    const dependencies: string[] = Object.keys(packageJson.dependencies || {}).filter(dep => dep.startsWith(context.vfPackagePrefix));
    const devDependencies: string[] = Object.keys(packageJson.devDependencies || {}).filter(dep => dep.startsWith(context.vfPackagePrefix));

    const components: string[] = [...dependencies, ...devDependencies];

    if (components.length === 0) {
      throw new NoVfDependenciesFoundError(packageJsonFile);
    }

    return components;
  }
}

export function getComponentsExactVersion(context: ProcessingContext): (components: string[]) => DiscoveryItem[] {
  return (components: string[]): DiscoveryItem[] => {
    const logger = getLogger();

    logger.debug('Retrieving the exact versions for each component');

    const componentsMap: { [name: string]: string } = {};
    const lockObject: LockObject = parseLockFile(context.rootDirectory);
    const processedLockObject: LockObject = Object.entries(lockObject).reduce((obj, [pkg, lockItem]) => ({
      ...obj,
      [pkg.split('@').slice(0, -1).join('@')]: lockItem
    }), {});

    for (const component of components) {
      if (processedLockObject[component]) {
        componentsMap[component] = processedLockObject[component].version;
      }
    }

    return Object.entries(componentsMap).map(([component, version]) => ({
      name: component,
      nameWithoutPrefix: component.replace(`${context.vfPackagePrefix}/`, ''),
      version
    } as DiscoveryItem));
  }
}

export function getComponentPackageJson(discoveryItem: DiscoveryItem): PackageJson {
  // TODO: validation - check existence
  const name = discoveryItem.nameWithoutPrefix;
  const packageJsonFileName = getVfCoreRepository('components', name, 'package.json');

  return JSON.parse(fs.readFileSync(packageJsonFileName, 'utf-8'));
}

export function extendWithComponentPackageJson(): (ds: DiscoveryItem[]) => DiscoveryItem[] {
  return (discoveryItems) => {
    const logger = getLogger();

    logger.debug('Retrieving latest packages information');

    return map(discoveryItems, (discoveryItem) => ({
      ...discoveryItem,
      packageJson: getComponentPackageJson(discoveryItem)
    }));
  };
}

export function getComponentConfig(discoveryItem: DiscoveryItem): ComponentConfig {
  const name = discoveryItem.nameWithoutPrefix;
  const yamlConfigFileName = getVfCoreRepository('components', name, `${name}.config.yml`);

  if (fs.existsSync(yamlConfigFileName)) {
    return yaml.parse(fs.readFileSync(yamlConfigFileName, 'utf-8'));
  }

  const moduleConfigFileName = getVfCoreRepository('components', name, `${name}.config.js`);
  return require(moduleConfigFileName);
}

export function extendWithComponentConfig(): (ds: DiscoveryItem[]) => DiscoveryItem[] {
  return (discoveryItems) => {
    const logger = getLogger();

    logger.debug('Retrieving lastest packages configuration');

    return map(discoveryItems, (discoveryItem) => ({
      ...discoveryItem,
      config: getComponentConfig(discoveryItem)
    }));
  };
}

export function getComponentCumulativeChangelog(discoveryItem: DiscoveryItem): ChangelogItem[] {
  const name = discoveryItem.nameWithoutPrefix;
  const changelogFileName = getVfCoreRepository('components', name, 'CHANGELOG.md');
  const changelogContents = fs.readFileSync(changelogFileName, 'utf-8');
  const lines = changelogContents.split('\n');
  const changelog: ChangelogItem[] = [];
  let changelogItem: ChangelogItem | undefined = undefined;
  const versionRegex = /### (\d+\.\d+\.\d+)/;

  for (const line of lines) {
    if (line.startsWith('###')) {
      const versionRegexResult = versionRegex.exec(line);
      const version = versionRegexResult && versionRegexResult[1];

      if (!version) {
        continue;
      }

      if (changelogItem) {
        changelog.push(changelogItem);
      }

      if (version === discoveryItem.version) {
        break;
      }

      changelogItem = {
        version,
        changes: []
      };
    } else if (line.startsWith('*') && changelogItem) {
      changelogItem.changes.push(line.replace(/^\*/, '').trim());
    }
  }

  return changelog;
}

export function extendWithCumulativeChangelog(): (ds: DiscoveryItem[]) => DiscoveryItem[] {
  return (discoveryItems) => map(discoveryItems, (discoveryItem) => ({
    ...discoveryItem,
    changelog: getComponentCumulativeChangelog(discoveryItem)
  }));
}
