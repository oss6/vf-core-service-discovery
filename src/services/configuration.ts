import fs from 'fs';
import { compareAsc, formatISO } from 'date-fns';
import rimraf from 'rimraf';
import { promisify } from 'util';
import {
  getAppConfigFileName,
  getAppDirectory,
  getCacheDirectory,
  getCacheFileName,
  parseRelativeTime,
} from '../helpers/misc';
import { AppConfig, Cache } from '../types';
import OptionsService from './options';
import LoggerService from './logger';
import { FileNotFoundError } from '../errors';
import mkdirp from 'mkdirp';

const rimrafP = promisify(rimraf);

export default class ConfigurationService {
  static defaultAppConfig: AppConfig = {
    vfCoreVersion: undefined,
    cacheExpiry: '12h',
    lastInvalidation: null,
  };
  static instance: ConfigurationService;
  private optionsService = OptionsService.getInstance();
  private loggerService = LoggerService.getInstance();
  private configuration: AppConfig;
  private logger = this.loggerService.getLogger();
  private defaultCache: Partial<Cache> = {
    components: {},
    lockObjects: {},
  };

  static getInstance(): ConfigurationService {
    if (ConfigurationService.instance) {
      return ConfigurationService.instance;
    }

    ConfigurationService.instance = new ConfigurationService();
    return ConfigurationService.instance;
  }

  get config(): AppConfig {
    return { ...this.configuration };
  }

  load(): void {
    const appConfigFileName = getAppConfigFileName();

    if (!fs.existsSync(appConfigFileName)) {
      throw new FileNotFoundError(appConfigFileName);
    }

    const appConfigContents = fs.readFileSync(appConfigFileName, 'utf-8');
    this.deserialize(appConfigContents);
  }

  reset(): void {
    const appConfigFileName = getAppConfigFileName();

    if (!fs.existsSync(appConfigFileName)) {
      throw new FileNotFoundError(appConfigFileName);
    }

    this.configuration = { ...ConfigurationService.defaultAppConfig };
    fs.writeFileSync(appConfigFileName, this.serialize());
  }

  async setup(): Promise<void> {
    const options = this.optionsService.getOptions();
    const appDirectory = getAppDirectory();
    const cacheDirectory = getCacheDirectory();
    const cacheFileName = getCacheFileName();
    const appConfigFileName = getAppConfigFileName();

    if (options.forceRun) {
      this.logger.debug(`Deleting app directory ${appDirectory}`);
      await rimrafP(appDirectory);
    }

    if (!fs.existsSync(appDirectory)) {
      this.logger.debug(`Creating app directory ${appDirectory}`);
      fs.mkdirSync(appDirectory);
    }

    if (!fs.existsSync(appConfigFileName)) {
      this.logger.debug(`Creating app configuration file ${appConfigFileName}`);

      this.configuration = { ...ConfigurationService.defaultAppConfig };
      fs.writeFileSync(appConfigFileName, this.serialize());
    } else {
      this.logger.debug('Using stored configuration');

      const appConfigContents = fs.readFileSync(appConfigFileName, 'utf-8');
      this.deserialize(appConfigContents);
    }

    if (!fs.existsSync(cacheDirectory)) {
      this.logger.debug(`Creating cache directory ${cacheDirectory}`);
      fs.mkdirSync(cacheDirectory);
    }

    if (!fs.existsSync(cacheFileName)) {
      this.logger.debug(`Creating cache ${cacheFileName}`);
      fs.writeFileSync(cacheFileName, JSON.stringify(this.defaultCache));
    }

    this.logger.debug('App configuration loaded successfully');
  }

  async getCache(): Promise<Cache> {
    return JSON.parse(await fs.promises.readFile(getCacheFileName(), 'utf-8'));
  }

  shouldInvalidate(): boolean {
    const now = new Date();

    return (
      this.configuration.lastInvalidation === null ||
      compareAsc(now, parseRelativeTime(this.configuration.cacheExpiry, this.configuration.lastInvalidation)) === 1
    );
  }

  async deleteCachedComponents(): Promise<void> {
    const cacheDirectory = getCacheDirectory();
    const cacheFileName = getCacheFileName();

    this.logger.debug(`Invalidating cache ${cacheDirectory}`);
    await rimrafP(cacheDirectory);
    await mkdirp(cacheDirectory);
    await fs.promises.writeFile(cacheFileName, JSON.stringify(this.defaultCache), 'utf-8');
  }

  update<T>(key: keyof AppConfig, value: T, persist = true): void {
    this.configuration = {
      ...(this.configuration || {}),
      [key]: value,
    };

    if (persist) {
      fs.writeFileSync(getAppConfigFileName(), this.serialize());
    }
  }

  private serialize(): string {
    return JSON.stringify({
      ...this.configuration,
      lastInvalidation:
        this.configuration.lastInvalidation !== null ? formatISO(this.configuration.lastInvalidation) : null,
    });
  }

  private deserialize(appConfig: string): void {
    const appConfigObject = JSON.parse(appConfig);

    this.configuration = {
      ...appConfigObject,
      lastInvalidation: appConfigObject.lastInvalidation ? new Date(appConfigObject.lastInvalidation) : null,
    };
  }
}
