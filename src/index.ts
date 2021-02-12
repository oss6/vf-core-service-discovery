import fs from 'fs';
import { Options, PipelineContext, PipelineItem } from './types';
import ConfigurationService from './services/configuration';
import OptionsService from './services/options';
import LoggerService from './services/logger';
import ApiService from './services/api';
import * as pipeline from './pipeline';
import { AppError } from './errors';
import { Logger } from 'winston';
import { getCacheFileName } from './helpers';

export { pipeline };

/**
 * Represents a service discovery instance.
 */
export class ServiceDiscovery {
  private static instance: ServiceDiscovery;
  private loggerService = LoggerService.getInstance();
  private optionsService: OptionsService;
  private configurationService: ConfigurationService;
  private apiService: ApiService;
  private hasBeenSetUp = false;
  private logger: Logger;
  private optionalSteps = ['getConfig', 'getChangelog', 'getDependents'];

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  /**
   * Returns the {@link ServiceDiscovery} singleton.
   */
  static getInstance(): ServiceDiscovery {
    if (ServiceDiscovery.instance) {
      return ServiceDiscovery.instance;
    }

    ServiceDiscovery.instance = new ServiceDiscovery();
    return ServiceDiscovery.instance;
  }

  /**
   * Sets up the service discovery prior to a run.
   * @param options Options to define the service discovery behaviour.
   */
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

  /**
   * Runs the service discovery.
   * @param reportProgress Whether to report progress in the cli.
   */
  async run(reportProgress = false): Promise<PipelineItem[]> {
    if (!this.hasBeenSetUp) {
      throw new AppError('The ServiceDiscovery instance has not been set up.');
    }

    try {
      this.logger.debug('Running service discovery');

      this.hasBeenSetUp = false;

      const { disabled } = this.optionsService.getOptions();
      const disabledSteps: string[] = disabled.filter((value) => this.optionalSteps.includes(value));

      const cache = await this.configurationService.getCache();
      const context: PipelineContext = {
        rootDirectory: process.cwd(),
        vfPackagePrefix: '@visual-framework',
        cache,
      };

      const components = await pipeline.getComponents(context);

      const pipelineItems = await pipeline.Pipeline.getInstance()
        .addStep({ fn: pipeline.getExactVersion, enabled: true })
        .addStep({ fn: pipeline.getPackageJson, enabled: true })
        .addStep({ fn: pipeline.getConfig, enabled: !disabledSteps.includes('getConfig') })
        .addStep({ fn: pipeline.getChangelog, enabled: !disabledSteps.includes('getChangelog') })
        .addStep({ fn: pipeline.getDependents, enabled: !disabledSteps.includes('getDependents') })
        .run(components, context, reportProgress);

      await fs.promises.writeFile(getCacheFileName(), JSON.stringify(context.cache));

      return pipelineItems;
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

export default ServiceDiscovery;
