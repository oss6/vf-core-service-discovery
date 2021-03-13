import fs from 'fs';
import { Options, PipelineContext, PipelineItem, ProjectType } from './types';
import ConfigurationService from './services/configuration';
import OptionsService from './services/options';
import LoggerService from './services/logger';
import ApiService from './services/api';
import * as pipeline from './pipeline';
import { AppError, errorLog } from './errors';
import { getCacheFileName } from './helpers/misc';
import DependentsService from './services/dependents';

export { pipeline };

/**
 * Represents a service discovery instance.
 */
export class ServiceDiscovery {
  private static instance: ServiceDiscovery;
  private loggerService = LoggerService.getInstance();
  private dependentsService: DependentsService;
  private optionsService: OptionsService;
  private configurationService: ConfigurationService;
  private apiService: ApiService;
  private hasBeenSetUp = false;
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
    this.loggerService.registerLogger(options.verbose ? 'debug' : 'info', options.logFile, !options.loggingEnabled);

    this.optionsService = OptionsService.getInstance();
    this.configurationService = ConfigurationService.getInstance();
    this.apiService = ApiService.getInstance();
    this.dependentsService = DependentsService.getInstance();

    try {
      this.loggerService.log('info', 'Running setup', this.setup);

      this.optionsService.setOptions(options);
      await this.configurationService.setup();

      if (options.forceRun || this.configurationService.shouldInvalidate()) {
        this.loggerService.log('info', 'Invalidating cache', this.setup);

        await this.configurationService.deleteCachedComponents();
        this.configurationService.update('lastInvalidation', new Date());
      }

      if (!this.configurationService.config.vfCoreVersion || options.forceRun) {
        this.loggerService.log('info', 'Retrieving vf-core version', this.setup);

        const vfCoreVersion = await this.apiService.getVfCoreLatestReleaseVersion();
        this.configurationService.update('vfCoreVersion', vfCoreVersion);
      }

      this.hasBeenSetUp = true;
    } catch (error) {
      this.loggerService.log('error', errorLog(error), this.setup);
      throw error;
    }
  }

  /**
   * Runs the service discovery.
   * @param reportProgress Whether to report progress in the cli.
   */
  async run(reportProgress = false): Promise<PipelineItem[]> {
    try {
      this.loggerService.log('info', 'Running service discovery', this.run);

      if (!this.hasBeenSetUp) {
        throw new AppError('The ServiceDiscovery instance has not been set up.');
      }

      this.hasBeenSetUp = false;

      const options = this.optionsService.getOptions();
      const cache = await this.configurationService.getCache();

      const projectType = (<any>ProjectType)[options.dependentsProjectType];
      const rootDirectory = process.cwd();

      const potentialDependents = await this.dependentsService.getPotentialDependents(
        rootDirectory,
        projectType,
        options.dependentsIgnore,
      );

      const context: PipelineContext = {
        rootDirectory,
        vfPackagePrefix: '@visual-framework',
        cache,
        potentialDependents,
      };

      const components = await pipeline.getComponents(context);

      const disabledSteps: string[] = options.disabled.filter((value) => this.optionalSteps.includes(value));
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
      this.loggerService.log('error', errorLog(error), this.run);

      if (error.context) {
        return error.context;
      } else {
        throw error;
      }
    }
  }
}

export default ServiceDiscovery;
