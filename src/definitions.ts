export interface PackageJson {
  version: string;
  dependencies?: { [key: string]: string };
  devDependencies?: { [key: string]: string }
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

export interface ProcessingContext {
  rootDirectory: string;
  vfPackagePrefix: string;
}
