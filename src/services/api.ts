/* eslint-disable @typescript-eslint/no-var-requires */
import 'isomorphic-fetch';
import fs from 'fs';
import yaml from 'yaml';
import { ComponentConfig, PackageJson, PipelineContext } from '../types';
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

  async getComponentPackageJson(name: string, context: PipelineContext): Promise<PackageJson> {
    const options = this.optionsService.getOptions();
    const fetchFromRemote = async (): Promise<PackageJson> => {
      this.logger.debug(`${name} - retrieving package.json from remote`);

      const vfCoreLatestReleaseVersion = this.configurationService.config.vfCoreVersion;

      if (!vfCoreLatestReleaseVersion) {
        throw new MissingConfigurationError(['vfCoreVersion']);
      }

      const response = await this.attemptFetch(vfCoreLatestReleaseVersion, name, 'package.json');
      const packageJson: PackageJson = await response.json();

      context.cache.components[name] = {
        ...(context.cache.components[name] || {}),
        packageJson,
      };

      return packageJson;
    };

    if (options.forceRun) {
      return await fetchFromRemote();
    }

    if (context.cache.components[name]?.packageJson) {
      this.logger.debug(`${name} - retrieving package.json from cache`);
      return context.cache.components[name].packageJson;
    } else {
      return await fetchFromRemote();
    }
  }

  async getYamlComponentConfig(name: string, context: PipelineContext): Promise<ComponentConfig | null> {
    const options = this.optionsService.getOptions();
    const fetchFromRemote = async (): Promise<ComponentConfig | null> => {
      this.logger.debug(`${name} - attempting to retrieve YAML configuration`);

      const vfCoreLatestReleaseVersion = this.configurationService.config.vfCoreVersion;

      if (!vfCoreLatestReleaseVersion) {
        throw new MissingConfigurationError(['vfCoreVersion']);
      }

      try {
        const yamlConfigResponse = await this.attemptFetch(vfCoreLatestReleaseVersion, name, `${name}.config.yml`);

        const content = await yamlConfigResponse.text();
        const config = yaml.parse(content);

        context.cache.components[name] = {
          ...(context.cache.components[name] || {}),
          config,
        };

        return config;
      } catch (error) {
        this.logger.debug(`${name} - YAML configuration not found`);
        return null;
      }
    };

    if (options.forceRun) {
      return await fetchFromRemote();
    }

    if (context.cache.components[name]?.config) {
      this.logger.debug(`${name} - retrieving configuration from cache`);
      return context.cache.components[name].config;
    } else {
      return await fetchFromRemote();
    }
  }

  async getJsComponentConfig(name: string, context: PipelineContext): Promise<ComponentConfig | null> {
    const options = this.optionsService.getOptions();
    const fetchFromRemote = async (): Promise<ComponentConfig | null> => {
      this.logger.debug(`${name} - attempting to retrieve JS configuration`);

      const vfCoreLatestReleaseVersion = this.configurationService.config.vfCoreVersion;

      if (!vfCoreLatestReleaseVersion) {
        throw new MissingConfigurationError(['vfCoreVersion']);
      }

      try {
        const jsConfigResponse = await this.attemptFetch(vfCoreLatestReleaseVersion, name, `${name}.config.js`);

        const content = await jsConfigResponse.text();

        const tempConfigFileName = `${name}.config-tmp.js`;
        await fs.promises.writeFile(tempConfigFileName, content, 'utf-8');
        const config = require(tempConfigFileName);
        await fs.promises.unlink(tempConfigFileName);

        context.cache.components[name] = {
          ...(context.cache.components[name] || {}),
          config,
        };

        return config;
      } catch (error) {
        this.logger.debug(`${name} - YAML configuration not found`);
        return null;
      }
    };

    if (options.forceRun) {
      return await fetchFromRemote();
    }

    if (context.cache.components[name]?.config) {
      this.logger.debug(`${name} - retrieving configuration from cache`);
      return context.cache.components[name].config;
    } else {
      return await fetchFromRemote();
    }
  }

  async getComponentChangelog(name: string, context: PipelineContext): Promise<string> {
    const options = this.optionsService.getOptions();
    const fetchFromRemote = async (): Promise<string> => {
      this.logger.debug(`${name} - retrieving changelog from remote`);

      const vfCoreLatestReleaseVersion = this.configurationService.config.vfCoreVersion;

      if (!vfCoreLatestReleaseVersion) {
        throw new MissingConfigurationError(['vfCoreVersion']);
      }

      const response = await this.attemptFetch(vfCoreLatestReleaseVersion, name, 'CHANGELOG.md');
      const changelog = await response.text();

      context.cache.components[name] = {
        ...(context.cache.components[name] || {}),
        changelog,
      };

      return changelog;
    };

    if (options.forceRun) {
      return await fetchFromRemote();
    }

    if (context.cache.components[name]?.changelog) {
      this.logger.debug(`${name} - retrieving changelog from cache`);
      return context.cache.components[name].changelog;
    } else {
      return await fetchFromRemote();
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
