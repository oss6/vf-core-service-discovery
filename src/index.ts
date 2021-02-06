import { Options, PDiscoveryItem, PipelineContext } from './types';
import ConfigurationService from './services/configuration';
import OptionsService from './services/options';
import LoggerService from './services/logger';
import ApiService from './services/api';
import * as pipeline from './pipeline';
import { AppError } from './errors';
import { Logger } from 'winston';

export { pipeline };

export default class ServiceDiscovery {
  private static instance: ServiceDiscovery;
  private loggerService = LoggerService.getInstance();
  private optionsService: OptionsService;
  private configurationService: ConfigurationService;
  private apiService: ApiService;
  private hasBeenSetUp = false;
  private logger: Logger;

  static getInstance(): ServiceDiscovery {
    if (ServiceDiscovery.instance) {
      return ServiceDiscovery.instance;
    }

    ServiceDiscovery.instance = new ServiceDiscovery();
    return ServiceDiscovery.instance;
  }

  async setup(options: Options): Promise<void> {
    this.logger = this.loggerService.registerLogger(
      options.verbose ? 'debug' : 'info',
      options.logFile,
      !options.loggingEnabled,
    );

    this.optionsService = OptionsService.getInstance();
    this.configurationService = ConfigurationService.getInstance();
    this.apiService = ApiService.getInstance();

    try {
      this.optionsService.setOptions(options);
      await this.configurationService.setup();

      if (options.forceRun || this.configurationService.shouldInvalidate()) {
        await this.configurationService.deleteCachedComponents();
        this.configurationService.update('lastInvalidation', new Date());
      }

      if (!this.configurationService.config.vfCoreVersion || options.forceRun) {
        const vfCoreVersion = await this.apiService.getVfCoreLatestReleaseVersion();
        this.configurationService.update('vfCoreVersion', vfCoreVersion);
      }

      this.hasBeenSetUp = true;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async run(reportProgress = false): Promise<PDiscoveryItem[]> {
    if (!this.hasBeenSetUp) {
      throw new AppError('The ServiceDiscovery instance has not been set up.');
    }

    try {
      this.logger.debug('Running service discovery');

      const context: PipelineContext = {
        rootDirectory: process.cwd(),
        vfPackagePrefix: '@visual-framework',
      };
      const components = await pipeline.getComponents(context);

      this.hasBeenSetUp = false;

      return await pipeline.Pipeline.getInstance()
        .addStep(pipeline.getExactVersion)
        .addStep(pipeline.getPackageJson)
        .addStep(pipeline.getConfig)
        .addStep(pipeline.getChangelog)
        .addStep(pipeline.getDependents)
        .run(components, context, reportProgress);
    } catch (error) {
      this.hasBeenSetUp = false;
      this.logger.error(error.message);

      if (error.context) {
        return error.context;
      } else {
        throw error;
      }
    }
  }
}
