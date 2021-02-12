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
  onlyOutdated: boolean;
  logFile: string;
  disabled: string[];
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

export type PipelineStepFn = (source: PipelineItem, context: PipelineContext) => Promise<PipelineItem>;

export interface PipelineStep {
  fn: PipelineStepFn;
  enabled: boolean;
}

export interface PipelineContext {
  rootDirectory: string;
  vfPackagePrefix: string;
  cache: Cache;
}

export interface Cache {
  lockObjects: LockObjectsCacheMap;
  components: ComponentsCacheMap;
}

export interface LockObjectsCacheMap {
  [key: string]: LockObject;
}

export interface ComponentsCacheMap {
  [key: string]: ComponentsCacheMapItems;
}

export interface ComponentsCacheMapItems {
  packageJson: PackageJson;
  config: ComponentConfig;
  changelog: string;
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

export type Reporter = (items: PipelineItem[]) => Promise<void>;
