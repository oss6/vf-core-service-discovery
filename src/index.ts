import fs from 'fs';
import path from 'path';
import { compareAsc, formatISO } from 'date-fns';
import rimraf from 'rimraf';
import { promisify } from 'util';
import { asyncFlow, getAppConfigFileName, getAppDirectory, parseRelativeTime } from './helpers';
import { getLogger } from './logger';
import { Logger } from 'winston';
import { AppConfig, DiscoveryItem, Options } from './types';
import { AppError } from './errors';
import { cloneRepository } from './git-client';

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

    throw new AppError('An error has occurred when initialising the app instance.');
  }

  async setupConfiguration(): Promise<void> {
    const appDirectory = getAppDirectory();
    const appConfigFileName = getAppConfigFileName();
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

    fs.writeFileSync(getAppConfigFileName(), this.serializeAppConfig());
  }

  async runServiceDiscovery(): Promise<DiscoveryItem[]> {
    await this.setupConfiguration();

    if (this.options.forceRun || this.shouldInvalidate()) {
      this.logger.debug('Started invalidation');

      await cloneRepository('https://github.com/visual-framework/vf-core.git', getAppDirectory('vf-core'));

      this.logger.debug('vf-core cloned successfully');

      this.updateLastInvalidation(new Date());
    }

    this.logger.debug('Running service discovery');

    const pipeline = await Promise.all(
      fs
        .readdirSync(path.join(__dirname, 'pipeline'))
        .filter((fileName) => fileName.endsWith('.js'))
        .map(async (fileName) => (await import(`./pipeline/${fileName}`)).default),
    );

    const discoveryItems = (await asyncFlow(...pipeline)) as DiscoveryItem[];

    return discoveryItems;
  }

  serializeAppConfig(): string {
    return JSON.stringify({
      ...this.appConfig,
      lastInvalidation: this.appConfig.lastInvalidation !== null ? formatISO(this.appConfig.lastInvalidation) : null,
    });
  }

  deserializeAppConfig(appConfig: string): void {
    const appConfigObject = JSON.parse(appConfig);

    this.appConfig = {
      ...appConfigObject,
      lastInvalidation: appConfigObject.lastInvalidation ? new Date(appConfigObject.lastInvalidation) : null,
    };
  }
}
