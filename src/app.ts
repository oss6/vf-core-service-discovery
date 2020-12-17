import fs from 'fs';
import os from 'os';
import path from 'path';
import { compareAsc, formatISO } from 'date-fns';
import rimraf from 'rimraf';
import { promisify } from 'util';
import { parseRelativeTime } from './helpers';
import { getLogger } from './logger';
import { Logger } from 'winston';
import { AppConfig, Options } from './types';
import { InternalError } from './errors';

const rimrafP = promisify(rimraf);

export default class App {
  private logger: Logger;
  private options: Options;
  private appConfig: AppConfig;
  private static instance: App;

  private constructor(options: Options) {
    this.logger = getLogger();
    this.options = options;
  }

  static getInstance(options?: Options): App {
    if (this.instance) {
      return this.instance;
    }

    if (options) {
      this.instance = new App(options);

      return this.instance;
    }

    // TODO: specify errors
    throw new InternalError();
  }

  getAppDirectory(...segments: string[]): string {
    return path.join(os.homedir(), '.vf-core-service-discovery', ...segments);
  }

  getAppConfigFileName(): string {
    return path.join(this.getAppDirectory(), 'config.json');
  }

  getVfCoreRepository(...segments: string[]): string {
    return path.join(this.getAppDirectory(), 'vf-core', ...segments);
  }

  async setupConfiguration(): Promise<void> {
    const appDirectory = this.getAppDirectory();
    const appConfigFileName = this.getAppConfigFileName();
    const defaultAppConfig: AppConfig = {
      cacheExpiry: '5h',
      lastInvalidation: null,
    };

    if (this.options.forceRun) {
      await rimrafP(appDirectory);
    }

    if (!fs.existsSync(appDirectory) && !fs.existsSync(appConfigFileName)) {
      this.logger.debug(`Creating app directory (${appDirectory})`);

      this.appConfig = defaultAppConfig;
      fs.mkdirSync(appDirectory);
      fs.writeFileSync(appConfigFileName, this.serializeAppConfig());
    } else {
      const appConfigContents = fs.readFileSync(appConfigFileName, 'utf-8');
      this.deserializeAppConfig(appConfigContents);
    }

    this.logger.debug('App configuration loaded successfully');
  }

  shouldInvalidate(): boolean {
    const now = new Date();

    return (
      this.appConfig.lastInvalidation === null ||
      compareAsc(now, parseRelativeTime(this.appConfig.cacheExpiry, this.appConfig.lastInvalidation)) === 1
    );
  }

  updateLastInvalidation(lastInvalidation: Date): void {
    this.appConfig = {
      ...this.appConfig,
      lastInvalidation,
    };

    fs.writeFileSync(this.getAppConfigFileName(), this.serializeAppConfig());
  }

  private serializeAppConfig(): string {
    return JSON.stringify({
      ...this.appConfig,
      lastInvalidation: this.appConfig.lastInvalidation !== null ? formatISO(this.appConfig.lastInvalidation) : null,
    });
  }

  private deserializeAppConfig(appConfig: string) {
    const appConfigObject = JSON.parse(appConfig);

    this.appConfig = {
      ...appConfigObject,
      lastInvalidation: appConfigObject.lastInvalidation ? new Date(appConfigObject.lastInvalidation) : null,
    };
  }
}
