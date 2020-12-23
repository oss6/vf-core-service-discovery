import 'isomorphic-fetch';
import fs from 'fs';
import semver from 'semver';
import mkdirp from 'mkdirp';
import yaml from 'yaml';
import path from 'path';
import packageJson from 'package-json';
import { ComponentConfig } from '../types';
import { getCachedComponentsDirectory } from '../helpers';
import OptionsService from './options';
import LoggerService from './logger';
import ConfigurationService from './configuration';

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
    const options = this.optionsService.getOptions();

    if (!this.configurationService.config || options.forceRun) {
      // TODO: handle error, authentication, and add typing
      const response = await fetch('https://api.github.com/repos/visual-framework/vf-core/tags');
      const tags: any[] = await response.json();

      this.configurationService.update('vfCoreVersion', tags[0].name);
    }

    return this.configurationService.config.vfCoreVersion;
  }

  async getComponentPackageJson(name: string): Promise<packageJson.AbbreviatedMetadata> {
    const options = this.optionsService.getOptions();
    const cachedContentFileName = getCachedComponentsDirectory(name, 'package.json');

    if (fs.existsSync(cachedContentFileName) && !options.forceRun) {
      this.logger.debug(`Retrieving ${name} package.json from cache`);

      const cachedContent = JSON.parse(fs.readFileSync(cachedContentFileName, 'utf-8'));
      return cachedContent;
    }

    this.logger.debug(`Retrieving ${name} package.json from remote`);

    const pkg = await packageJson(`@visual-framework/${name}`);

    await mkdirp(path.dirname(cachedContentFileName));
    fs.writeFileSync(cachedContentFileName, JSON.stringify(pkg), 'utf-8');

    return pkg;
  }

  async getComponentConfig(name: string): Promise<ComponentConfig> {
    const vfCoreLatestReleaseVersion = await this.getVfCoreLatestReleaseVersion();

    // YAML configuration
    // ------------------
    const options = this.optionsService.getOptions();
    let cachedContentFileName = getCachedComponentsDirectory(name, `${name}.config.yml`);

    if (fs.existsSync(cachedContentFileName) && !options.forceRun) {
      this.logger.debug(`Retrieving ${name} configuration from cache`);

      const cachedContent = fs.readFileSync(cachedContentFileName, 'utf-8');
      return yaml.parse(cachedContent);
    }

    this.logger.debug(`Attempting to retrieve ${name} YAML configuration`);

    const yamlConfigResponse = await fetch(
      this.buildVfCoreContentUrl(vfCoreLatestReleaseVersion, name, `${name}.config.yml`),
    );

    if (yamlConfigResponse.ok) {
      const content = await yamlConfigResponse.text();

      await mkdirp(path.dirname(cachedContentFileName));
      fs.writeFileSync(cachedContentFileName, content, 'utf-8');

      return yaml.parse(content);
    }

    // JS configuration
    // ----------------
    this.logger.debug(`Attempting to retrieve ${name} JS configuration`);

    cachedContentFileName = getCachedComponentsDirectory(name, `${name}.config.js`);

    if (fs.existsSync(cachedContentFileName) && !options.forceRun) {
      this.logger.debug(`Retrieving ${name} configuration from cache`);

      return require(cachedContentFileName);
    }

    const jsConfigResponse = await fetch(
      this.buildVfCoreContentUrl(vfCoreLatestReleaseVersion, name, `${name}.config.js`),
    );

    if (jsConfigResponse.ok) {
      const content = await jsConfigResponse.text();

      await mkdirp(path.dirname(cachedContentFileName));
      fs.writeFileSync(cachedContentFileName, content, 'utf-8');

      return require(cachedContentFileName);
    }

    // TODO: change Error type
    throw new Error();
  }

  async getComponentChangelog(name: string): Promise<string> {
    const vfCoreLatestReleaseVersion = await this.getVfCoreLatestReleaseVersion();
    const options = this.optionsService.getOptions();
    const cachedContentFileName = getCachedComponentsDirectory(name, 'CHANGELOG.md');

    if (fs.existsSync(cachedContentFileName) && !options.forceRun) {
      this.logger.debug(`Retrieving ${name} changelog from cache`);

      const cachedContent = fs.readFileSync(cachedContentFileName, 'utf-8');
      return cachedContent;
    }

    this.logger.debug(`Retrieving ${name} package.json from remote`);

    const response = await fetch(this.buildVfCoreContentUrl(vfCoreLatestReleaseVersion, name, 'CHANGELOG.md'));
    const content = await response.text();

    await mkdirp(path.dirname(cachedContentFileName));
    fs.writeFileSync(cachedContentFileName, content, 'utf-8');

    return content;
  }

  private buildVfCoreContentUrl(version: string, component: string, resource: string): string {
    return `https://raw.githubusercontent.com/visual-framework/vf-core/${version}/components/${component}/${resource}`;
  }
}
