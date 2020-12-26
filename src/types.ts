export interface AppConfig {
  gitHubAccessToken?: string;
  vfCoreVersion?: string;
  cacheExpiry: string;
  lastInvalidation: Date | null;
}

export interface Options {
  forceRun: boolean;
  forceGitHubAuth: boolean;
}

export interface PackageJson {
  version: string;
  dependencies?: { [key: string]: string };
  devDependencies?: { [key: string]: string };
}

export interface ComponentConfig {
  title: string;
  label: string;
  status: string;
}

export interface ChangelogItem {
  version: string;
  changes: string[];
}

export interface DiscoveryItem {
  name: string;
  nameWithoutPrefix: string;
  version: string;
  packageJson: PackageJson;
  config: ComponentConfig;
  changelog: ChangelogItem[];
  dependents: string[];
}

export type DiscoveryItemStep02 = Pick<DiscoveryItem, 'name' | 'nameWithoutPrefix' | 'version'>;
export type DiscoveryItemStep03 = Pick<DiscoveryItem, 'name' | 'nameWithoutPrefix' | 'version' | 'packageJson'>;
export type DiscoveryItemStep04 = Omit<DiscoveryItem, 'changelog' | 'dependents'>;
export type DiscoveryItemStep05 = Omit<DiscoveryItem, 'changelog'>;

export interface ProcessingContext {
  rootDirectory: string;
  vfPackagePrefix: string;
}

export interface LockItem {
  version: string;
  resolved: string;
  integrity: string;
  dev?: boolean;
  dependencies?: Record<string, string>;
  requires?: Record<string, string>;
}

export interface LockObject {
  [pkg: string]: LockItem;
}

export type PipelineItem = (a: any) => Promise<any>;

export interface ParsedRelativeTime {
  years?: number;
  months?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}
