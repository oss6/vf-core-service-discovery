import 'isomorphic-fetch';
import fs from 'fs';
import semver from 'semver';
import open from 'open';
import mkdirp from 'mkdirp';
import yaml from 'yaml';
import path from 'path';
import { ComponentConfig, PackageJson } from '../types';
import { getCachedComponentsDirectory, getSeconds, sleep } from '../helpers';
import OptionsService from './options';
import LoggerService from './logger';
import ConfigurationService from './configuration';
import { AppError, GitHubAuthenticationError, MissingConfigurationError } from '../errors';

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

  async authenticateGitHub(): Promise<string> {
    // (1) get device and user code
    const response = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      body: JSON.stringify({
        client_id: 'd7d227d46d4ee4e5991a',
      }),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new GitHubAuthenticationError(
        'User verification code request has failed. Check if the client_id parameter is set correctly.',
      );
    }

    const { user_code, verification_uri, interval, device_code, expires_in } = await response.json();
    const expiry = Math.floor(expires_in / 60);

    // (2) get access token
    this.logger.info(`Please enter the code ${user_code} at ${verification_uri}. This expires in ${expiry} minutes.`);

    await sleep(1500);
    await open(verification_uri);

    let done = false;
    let lastTimestamp = getSeconds();
    let accessTokenResponse: Response | null = null;
    let accessTokenData: any;

    while (!done) {
      const currentTimestamp = getSeconds();

      if (currentTimestamp - lastTimestamp >= interval + 1) {
        // this.logger.debug('Making an access token request');

        accessTokenResponse = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          body: JSON.stringify({
            client_id: 'd7d227d46d4ee4e5991a',
            device_code: device_code,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          }),
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });

        accessTokenData = await accessTokenResponse.json();

        if (accessTokenResponse.ok && !accessTokenData.error) {
          this.logger.info('Authentication completed');
          done = true;
        } else if (accessTokenData.error === 'access_denied' || accessTokenData.error === 'expired_token') {
          this.logger.error(accessTokenData.error_description);
          done = true;
        } else if (accessTokenData.error === 'authorization_pending') {
          this.logger.debug(accessTokenData.error_description);
        }

        lastTimestamp = getSeconds();
      }
    }

    return accessTokenData?.access_token;
  }

  async getVfCoreLatestReleaseVersion(): Promise<string> {
    const accessToken = this.configurationService.config.gitHubAccessToken;

    const response = await fetch('https://api.github.com/repos/visual-framework/vf-core/tags', {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new AppError('Could not retrieve vf-core latest release version.');
    }

    const tags: string[] = (await response.json()).map((t: { name: string }) => t.name);
    tags.sort((a, b) => semver.compare(b, a));

    return tags[0];
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

    const response = await fetch(this.buildVfCoreContentUrl(vfCoreLatestReleaseVersion, name, 'package.json'));
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
    this.logger.debug(`${name} - attempting to retrieve JS configuration`);

    cachedContentFileName = getCachedComponentsDirectory(name, `${name}.config.js`);

    if (fs.existsSync(cachedContentFileName) && !options.forceRun) {
      this.logger.debug(`${name} - retrieving configuration from cache`);

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

    throw new AppError(`Could not find a configuration file for ${name}`);
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
