import 'isomorphic-fetch';
import fs from 'fs';
import mkdirp from 'mkdirp';
import yaml from 'yaml';
import path from 'path';
import { ComponentConfig, PackageJson } from '../types';
import { getCachedComponentsDirectory } from '../helpers';
import OptionsService from './options';
import LoggerService from './logger';
import ConfigurationService from './configuration';
import { AppError, MissingConfigurationError } from '../errors';

export default class ApiService {
  static instance: ApiService;
  private optionsService = OptionsService.getInstance();
  private configurationService = ConfigurationService.getInstance();
  private loggerService = LoggerService.getInstance();
  private logger = this.loggerService.getLogger();

  static getInstance(): ApiService {
    if (ApiService.instance) {
      return ApiService.instance;
    }

    ApiService.instance = new ApiService();
    return ApiService.instance;
  }

  async getVfCoreLatestReleaseVersion(): Promise<string> {
    const response = await fetch('https://api.github.com/repos/visual-framework/vf-core/releases/latest');

    if (!response.ok) {
      return 'develop';
    }

    const content = await response.json();
    const latestReleaseVersion: string = content.tag_name;

    return latestReleaseVersion;
  }

  async getComponentPackageJson(name: string): Promise<PackageJson> {
    const vfCoreLatestReleaseVersion = this.configurationService.config.vfCoreVersion;

    if (!vfCoreLatestReleaseVersion) {
      throw new MissingConfigurationError(['vfCoreVersion']);
    }

    const options = this.optionsService.getOptions();
    const cachedContentFileName = getCachedComponentsDirectory(name, 'package.json');

    if (fs.existsSync(cachedContentFileName) && !options.forceRun) {
      this.logger.debug(`${name} - retrieving package.json from cache`);

      const cachedContent = JSON.parse(fs.readFileSync(cachedContentFileName, 'utf-8'));
      return cachedContent;
    }

    this.logger.debug(`${name} - retrieving package.json from remote`);

    const response = await this.attemptFetch(vfCoreLatestReleaseVersion, name, 'package.json');
    const packageJson: PackageJson = await response.json();

    await mkdirp(path.dirname(cachedContentFileName));
    fs.writeFileSync(cachedContentFileName, JSON.stringify(packageJson), 'utf-8');

    return packageJson;
  }

  async getComponentConfig(name: string): Promise<ComponentConfig> {
    const vfCoreLatestReleaseVersion = this.configurationService.config.vfCoreVersion;

    if (!vfCoreLatestReleaseVersion) {
      throw new MissingConfigurationError(['vfCoreVersion']);
    }

    // YAML configuration
    // ------------------
    const options = this.optionsService.getOptions();
    let cachedContentFileName = getCachedComponentsDirectory(name, `${name}.config.yml`);

    if (fs.existsSync(cachedContentFileName) && !options.forceRun) {
      this.logger.debug(`${name} - retrieving configuration from cache`);

      const cachedContent = fs.readFileSync(cachedContentFileName, 'utf-8');
      return yaml.parse(cachedContent);
    }

    this.logger.debug(`${name} - attempting to retrieve YAML configuration`);

    try {
      const yamlConfigResponse = await this.attemptFetch(vfCoreLatestReleaseVersion, name, `${name}.config.yml`);

      const content = await yamlConfigResponse.text();

      await mkdirp(path.dirname(cachedContentFileName));
      fs.writeFileSync(cachedContentFileName, content, 'utf-8');

      return yaml.parse(content);
    } catch (error) {
      this.logger.debug(`${name} - YAML configuration not found`);
    }

    // JS configuration
    // ----------------
    this.logger.debug(`${name} - attempting to retrieve JS configuration`);

    cachedContentFileName = getCachedComponentsDirectory(name, `${name}.config.js`);

    if (fs.existsSync(cachedContentFileName) && !options.forceRun) {
      this.logger.debug(`${name} - retrieving configuration from cache`);

      return require(cachedContentFileName);
    }

    try {
      const jsConfigResponse = await this.attemptFetch(vfCoreLatestReleaseVersion, name, `${name}.config.js`);

      const content = await jsConfigResponse.text();

      await mkdirp(path.dirname(cachedContentFileName));
      fs.writeFileSync(cachedContentFileName, content, 'utf-8');

      return require(cachedContentFileName);
    } catch (error) {
      throw new AppError(`${name} - could not find a configuration file`);
    }
  }

  async getComponentChangelog(name: string): Promise<string> {
    const vfCoreLatestReleaseVersion = this.configurationService.config.vfCoreVersion;

    if (!vfCoreLatestReleaseVersion) {
      throw new MissingConfigurationError(['vfCoreVersion']);
    }

    const options = this.optionsService.getOptions();
    const cachedContentFileName = getCachedComponentsDirectory(name, 'CHANGELOG.md');

    if (fs.existsSync(cachedContentFileName) && !options.forceRun) {
      this.logger.debug(`${name} - retrieving changelog from cache`);

      const cachedContent = fs.readFileSync(cachedContentFileName, 'utf-8');
      return cachedContent;
    }

    this.logger.debug(`${name} - retrieving changelog from remote`);

    const response = await this.attemptFetch(vfCoreLatestReleaseVersion, name, 'CHANGELOG.md');
    const content = await response.text();

    await mkdirp(path.dirname(cachedContentFileName));
    fs.writeFileSync(cachedContentFileName, content, 'utf-8');

    return content;
  }

  private async attemptFetch(
    vfCoreLatestReleaseVersion: string,
    componentName: string,
    resource: string,
  ): Promise<Response> {
    const urls = [
      this.buildVfCoreContentUrl(vfCoreLatestReleaseVersion, 'components', componentName, resource),
      this.buildVfCoreContentUrl(vfCoreLatestReleaseVersion, 'tools', componentName, resource),
    ];

    for (const url of urls) {
      const response = await fetch(url);

      if (response.ok) {
        return response;
      }
    }

    throw new AppError(`${componentName} - could not fetch ${resource}`);
  }

  private buildVfCoreContentUrl(version: string, directory: string, component: string, resource: string): string {
    return `https://raw.githubusercontent.com/visual-framework/vf-core/${version}/${directory}/${component}/${resource}`;
  }
}
