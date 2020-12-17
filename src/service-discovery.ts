import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import glob from 'glob';
import { ChangelogItem, ComponentConfig, DiscoveryItem, PackageJson } from './types';
import { FileNotFoundError, InternalError, NoVfDependenciesFoundError } from './errors';
import parseLockFile, { LockObject } from './parse-lock-file';
import map from 'lodash/map';
import { getLogger } from './logger';
import getContext from './context';
import App from './app';

export function getComponentsFromPackageJson(): string[] {
  const logger = getLogger();
  const context = getContext();

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

  // TODO: fix this once we know where vf-form is
  return components.filter(c => !c.includes('vf-form'));
}

export function getComponentsExactVersion(components: string[]): DiscoveryItem[] {
  const logger = getLogger();
  const context = getContext();

  logger.debug('Retrieving the exact versions for each component');

  const componentsMap: { [name: string]: string } = {};
  const lockObject: LockObject = parseLockFile(context.rootDirectory);

  for (const component of components) {
    if (lockObject[component]) {
      componentsMap[component] = lockObject[component].version;
    }
  }

  return Object.entries(componentsMap).map(([component, version]) => ({
    name: component,
    nameWithoutPrefix: component.replace(`${context.vfPackagePrefix}/`, ''),
    version
  } as DiscoveryItem));
}

export function getComponentPackageJson(discoveryItem: DiscoveryItem): PackageJson {
  // TODO: validation - check existence
  const app = App.getInstance();
  const name = discoveryItem.nameWithoutPrefix;
  const packageJsonFileName = app.getVfCoreRepository('components', name, 'package.json');

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
  const app = App.getInstance();
  const name = discoveryItem.nameWithoutPrefix;
  const yamlConfigFileName = app.getVfCoreRepository('components', name, `${name}.config.yml`);

  if (fs.existsSync(yamlConfigFileName)) {
    return yaml.parse(fs.readFileSync(yamlConfigFileName, 'utf-8'));
  }

  const moduleConfigFileName = app.getVfCoreRepository('components', name, `${name}.config.js`);
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
  const app = App.getInstance();
  const name = discoveryItem.nameWithoutPrefix;
  const changelogFileName = app.getVfCoreRepository('components', name, 'CHANGELOG.md');
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

// TODO: should optimise (this is a very naive implementation to demonstrate the concept)
export function extendWithComponentsDependents(ds: DiscoveryItem[]): Promise<DiscoveryItem[]> {
  return new Promise((resolve, reject) => {
    const discoveryItems = [...ds];
    const context = getContext();

    // TODO: consider other patterns (e.g. templates in .ts files in Angular)
    glob(context.rootDirectory + '/**/*.html', { ignore: 'node_modules' }, (error, matches) => {
      if (error) {
        reject(new InternalError());
        // throw new InternalError();
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
