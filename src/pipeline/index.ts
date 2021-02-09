import Listr from 'listr';
import OptionsService from '../services/options';
import { PDiscoveryItem, PipelineContext, PipelineItem, PipelineStep } from '../types';
import getComponents from './steps/00-get-components';
import getExactVersion from './steps/01-get-exact-version';
import getPackageJson from './steps/02-get-package-json';
import getConfig from './steps/03-get-config';
import getChangelog from './steps/04-get-changelog';
import getDependents from './steps/05-get-dependents';

export { getComponents, getExactVersion, getPackageJson, getConfig, getChangelog, getDependents };

/**
 * Defines a pipeline which processes discovery items.
 */
export class Pipeline {
  static instance: Pipeline;
  private steps: PipelineStep[];
  private optionsService = OptionsService.getInstance();

  private constructor() {
    this.steps = [];
  }

  /**
   * Returns the {@link Pipeline} singleton.
   */
  static getInstance(): Pipeline {
    if (Pipeline.instance) {
      return Pipeline.instance;
    }

    Pipeline.instance = new Pipeline();
    return Pipeline.instance;
  }

  /**
   * Adds a pipeline step.
   * @param step The pipeline step to add.
   */
  addStep(step: PipelineStep): Pipeline {
    this.steps.push(step);
    return this;
  }

  /**
   * Runs the pipeline.
   * @param source The components to work on.
   * @param context The pipeline context containing the root directory and the vf package prefix.
   * @param reportProgress Whether to report progress in the cli.
   */
  async run(source: string[], context: PipelineContext, reportProgress = false): Promise<PipelineItem[]> {
    const options = this.optionsService.getOptions();
    const discoveryItems: PDiscoveryItem[] = source.map((sourceItem) => ({
      name: sourceItem,
      nameWithoutPrefix: sourceItem.replace('@visual-framework/', ''),
    }));

    const processes: Listr.ListrTask<PipelineItem[]>[] = discoveryItems.map((discoveryItem) => ({
      title: discoveryItem.nameWithoutPrefix || '',
      task: async (ctx) => {
        const result = await this.steps
          .filter((step) => step.enabled)
          .reduce(
            async (previousPromise, step) => step.fn(await previousPromise, context),
            Promise.resolve({
              discoveryItem,
              profilingInformation: {},
            }),
          );

        ctx.push(result);
      },
    }));

    const tasks = new Listr(processes, {
      concurrent: 5,
      exitOnError: false,
      renderer: reportProgress && !options.verbose ? 'default' : 'silent',
    });

    return await tasks.run([]);
  }
}
