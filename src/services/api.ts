import 'isomorphic-fetch';
import fs from 'fs';
import mkdirp from 'mkdirp';
import yaml from 'yaml';
import path from 'path';
import { ComponentConfig, PackageJson } from '../types';
import { getCachedComponentsDirectory } from '../helpers';
import OptionsService from './options';
import LoggerService from './logger';

export default class ApiService {
  static instance: ApiService;
  private optionsService = OptionsService.getInstance();
  private loggerService = LoggerService.getInstance();
  private componentContentBaseUrl = 'https://raw.githubusercontent.com/visual-framework/vf-core/develop/components';
  private logger = this.loggerService.getLogger();

  static getInstance(): ApiService {
    if (ApiService.instance) {
      return ApiService.instance;
    }

    ApiService.instance = new ApiService();
    return ApiService.instance;
  }

  async getComponentPackageJson(name: string): Promise<PackageJson> {
    const options = this.optionsService.getOptions();
    const cachedContentFileName = getCachedComponentsDirectory(name, 'package.json');

    if (fs.existsSync(cachedContentFileName) && !options.forceRun) {
      this.logger.debug(`Retrieving ${name} package.json from cache`);

      const cachedContent = JSON.parse(fs.readFileSync(cachedContentFileName, 'utf-8'));
      return cachedContent;
    }

    this.logger.debug(`Retrieving ${name} package.json from remote`);

    const response = await fetch(`${this.componentContentBaseUrl}/${name}/package.json`);
    const content = await response.text();

    await mkdirp(path.dirname(cachedContentFileName));
    fs.writeFileSync(cachedContentFileName, content, 'utf-8');

    return JSON.parse(content);
  }

  async getComponentConfig(name: string): Promise<ComponentConfig> {
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

    const yamlConfigResponse = await fetch(`${this.componentContentBaseUrl}/${name}/${name}.config.yml`);

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

    const jsConfigResponse = await fetch(`${this.componentContentBaseUrl}/${name}/${name}.config.js`);

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
    const options = this.optionsService.getOptions();
    const cachedContentFileName = getCachedComponentsDirectory(name, 'CHANGELOG.md');

    if (fs.existsSync(cachedContentFileName) && !options.forceRun) {
      this.logger.debug(`Retrieving ${name} changelog from cache`);

      const cachedContent = fs.readFileSync(cachedContentFileName, 'utf-8');
      return cachedContent;
    }

    this.logger.debug(`Retrieving ${name} package.json from remote`);

    const response = await fetch(`${this.componentContentBaseUrl}/${name}/CHANGELOG.md`);
    const content = await response.text();

    await mkdirp(path.dirname(cachedContentFileName));
    fs.writeFileSync(cachedContentFileName, content, 'utf-8');

    return content;
  }
}
