export interface AppConfig {
  vfCoreVersion?: string;
  cacheExpiry: string;
  lastInvalidation: Date | null;
}

export interface Options {
  forceRun: boolean;
  verbose: boolean;
  profile: boolean;
  loggingEnabled: boolean;
  logFile: string;
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

export type PDiscoveryItem = Partial<DiscoveryItem>;

export interface ProfilingInformation {
  [key: string]: number | undefined;
}

export interface PipelineItem {
  discoveryItem: PDiscoveryItem;
  profilingInformation: ProfilingInformation;
}

export type PipelineStep = (source: PipelineItem, context: PipelineContext) => Promise<PipelineItem>;

export interface PipelineContext {
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

export interface ParsedRelativeTime {
  years?: number;
  months?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

export interface ProfiledResult<T> {
  result: T;
  took?: number;
}
