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

    const fetchFromRemote = async (): Promise<PackageJson> => {
      this.logger.debug(`${name} - retrieving package.json from remote`);

      const response = await this.attemptFetch(vfCoreLatestReleaseVersion, name, 'package.json');
      const packageJson: PackageJson = await response.json();

      await mkdirp(path.dirname(cachedContentFileName));
      await fs.promises.writeFile(cachedContentFileName, JSON.stringify(packageJson), 'utf-8');

      return packageJson;
    };
    const options = this.optionsService.getOptions();
    const cachedContentFileName = getCachedComponentsDirectory(name, 'package.json');

    if (options.forceRun) {
      return await fetchFromRemote();
    }

    try {
      this.logger.debug(`${name} - retrieving package.json from cache`);

      const cachedContent = JSON.parse(await fs.promises.readFile(cachedContentFileName, 'utf-8'));
      return cachedContent;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return await fetchFromRemote();
      } else {
        throw error;
      }
    }
  }

  async getYamlComponentConfig(name: string): Promise<ComponentConfig | null> {
    const vfCoreLatestReleaseVersion = this.configurationService.config.vfCoreVersion;

    if (!vfCoreLatestReleaseVersion) {
      throw new MissingConfigurationError(['vfCoreVersion']);
    }

    this.logger.debug(`${name} - attempting to retrieve YAML configuration`);

    const options = this.optionsService.getOptions();
    const cachedContentFileName = getCachedComponentsDirectory(name, `${name}.config.yml`);
    const fetchFromRemote = async (): Promise<ComponentConfig | null> => {
      try {
        const yamlConfigResponse = await this.attemptFetch(vfCoreLatestReleaseVersion, name, `${name}.config.yml`);

        const content = await yamlConfigResponse.text();

        await mkdirp(path.dirname(cachedContentFileName));
        await fs.promises.writeFile(cachedContentFileName, content, 'utf-8');

        return yaml.parse(content);
      } catch (error) {
        this.logger.debug(`${name} - YAML configuration not found`);
        return null;
      }
    };

    if (options.forceRun) {
      return await fetchFromRemote();
    }

    try {
      this.logger.debug(`${name} - retrieving configuration from cache`);

      const cachedContent = await fs.promises.readFile(cachedContentFileName, 'utf-8');
      return yaml.parse(cachedContent);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return await fetchFromRemote();
      } else {
        throw error;
      }
    }
  }

  async getJsComponentConfig(name: string): Promise<ComponentConfig | null> {
    const vfCoreLatestReleaseVersion = this.configurationService.config.vfCoreVersion;

    if (!vfCoreLatestReleaseVersion) {
      throw new MissingConfigurationError(['vfCoreVersion']);
    }

    this.logger.debug(`${name} - attempting to retrieve JS configuration`);

    const options = this.optionsService.getOptions();
    const cachedContentFileName = getCachedComponentsDirectory(name, `${name}.config.js`);
    const fetchFromRemote = async (): Promise<ComponentConfig | null> => {
      try {
        const jsConfigResponse = await this.attemptFetch(vfCoreLatestReleaseVersion, name, `${name}.config.js`);

        const content = await jsConfigResponse.text();

        await mkdirp(path.dirname(cachedContentFileName));
        await fs.promises.writeFile(cachedContentFileName, content, 'utf-8');

        return require(cachedContentFileName);
      } catch (error) {
        this.logger.debug(`${name} - YAML configuration not found`);
        return null;
      }
    };

    if (options.forceRun) {
      return await fetchFromRemote();
    }

    try {
      this.logger.debug(`${name} - retrieving configuration from cache`);

      return require(cachedContentFileName);
    } catch (error) {
      if (error === 'ENOENT') {
        return await fetchFromRemote();
      } else {
        throw error;
      }
    }
  }

  async getComponentChangelog(name: string): Promise<string> {
    const vfCoreLatestReleaseVersion = this.configurationService.config.vfCoreVersion;

    if (!vfCoreLatestReleaseVersion) {
      throw new MissingConfigurationError(['vfCoreVersion']);
    }

    const options = this.optionsService.getOptions();
    const cachedContentFileName = getCachedComponentsDirectory(name, 'CHANGELOG.md');
    const fetchFromRemote = async (): Promise<string> => {
      this.logger.debug(`${name} - retrieving changelog from remote`);

      const response = await this.attemptFetch(vfCoreLatestReleaseVersion, name, 'CHANGELOG.md');
      const content = await response.text();

      await mkdirp(path.dirname(cachedContentFileName));
      await fs.promises.writeFile(cachedContentFileName, content, 'utf-8');

      return content;
    };

    if (options.forceRun) {
      return await fetchFromRemote();
    }

    try {
      this.logger.debug(`${name} - retrieving changelog from cache`);

      const cachedContent = await fs.promises.readFile(cachedContentFileName, 'utf-8');
      return cachedContent;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return await fetchFromRemote();
      } else {
        throw error;
      }
    }
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
