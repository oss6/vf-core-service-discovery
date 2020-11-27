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

export interface DiscoveryItem {
  name: string;
  nameWithoutPrefix: string;
  version: string;
  packageJson: PackageJson;
  config: ComponentConfig;
  changelog: any;
  dependents: string[];
}
