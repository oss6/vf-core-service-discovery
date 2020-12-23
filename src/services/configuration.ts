import fs from 'fs';
import { compareAsc, formatISO } from 'date-fns';
import rimraf from 'rimraf';
import { promisify } from 'util';
import { getAppConfigFileName, getAppDirectory, getCachedComponentsDirectory, parseRelativeTime } from '../helpers';
import { AppConfig } from '../types';
import OptionsService from './options';
import LoggerService from './logger';

const rimrafP = promisify(rimraf);

export default class ConfigurationService {
  static instance: ConfigurationService;
  private optionsService = OptionsService.getInstance();
  private loggerService = LoggerService.getInstance();
  private configuration: AppConfig;
  private logger = this.loggerService.getLogger();

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

  async setup(): Promise<void> {
    const options = this.optionsService.getOptions();
    const appDirectory = getAppDirectory();
    const cachedComponentsDirectory = getCachedComponentsDirectory();
    const appConfigFileName = getAppConfigFileName();
    const defaultAppConfig: AppConfig = {
      vfCoreVersion: '',
      cacheExpiry: '2d',
      lastInvalidation: null,
    };

    if (options.forceRun) {
      await rimrafP(appDirectory);
    }

    if (!fs.existsSync(appDirectory)) {
      this.logger.debug(`Creating app directory ${appDirectory}`);
      fs.mkdirSync(appDirectory);
    }

    if (!fs.existsSync(appConfigFileName)) {
      this.logger.debug(`Creating app configuration file ${appConfigFileName}`);

      this.configuration = defaultAppConfig;
      fs.writeFileSync(appConfigFileName, this.serialize());
    } else {
      const appConfigContents = fs.readFileSync(appConfigFileName, 'utf-8');
      this.deserialize(appConfigContents);
    }

    if (!fs.existsSync(cachedComponentsDirectory)) {
      this.logger.debug(`Creating cache ${cachedComponentsDirectory}`);
      fs.mkdirSync(cachedComponentsDirectory);
    }

    this.logger.debug('App configuration loaded successfully');
  }

  shouldInvalidate(): boolean {
    const now = new Date();

    return (
      this.configuration.lastInvalidation === null ||
      compareAsc(now, parseRelativeTime(this.configuration.cacheExpiry, this.configuration.lastInvalidation)) === 1
    );
  }

  async deleteCachedComponents(): Promise<void> {
    await rimrafP(getCachedComponentsDirectory());
  }

  update<T>(key: keyof AppConfig, value: T): void {
    this.configuration = {
      ...this.configuration,
      [key]: value,
    };

    fs.writeFileSync(getAppConfigFileName(), this.serialize());
  }

  updateLastInvalidation(lastInvalidation: Date): void {
    this.configuration = {
      ...this.configuration,
      lastInvalidation,
    };

    fs.writeFileSync(getAppConfigFileName(), this.serialize());
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
