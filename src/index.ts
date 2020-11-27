import { createAppDirectoryIfNotExistent, getAppDirectory, shouldInvalidate } from './core/app-config';
import { cloneRepository } from './core/git-client';
import localComponentsRetriever from './local-components-retriever';

export interface DiscoveryItem {
  component: string;
  version: string;
  dependents: string[];
  status: string;
}

export async function discover(rootDirectory: string): Promise<DiscoveryItem[]> {
  const appConfig = createAppDirectoryIfNotExistent();

  if (shouldInvalidate(appConfig)) {
    console.log('cloning');
    await cloneRepository('https://github.com/visual-framework/vf-core.git', getAppDirectory('vf-core'));

  }

  const discoveryOutput: DiscoveryItem[] = [];
  const componentsMap = localComponentsRetriever(rootDirectory);

  for (const [component, version] of Object.entries(componentsMap)) {
    discoveryOutput.push({
      component,
      version,
      dependents: [],
      status: 'live'
    });
  }

  // get latest versions and yaml of the components

  // get used components per file

  return discoveryOutput;
}
