import Listr from 'listr';
import { PDiscoveryItem, PipelineContext, PipelineStep } from '../types';
import getComponents from './steps/00-get-components';
import getExactVersion from './steps/01-get-exact-version';
import getPackageJson from './steps/02-get-package-json';
import getConfig from './steps/03-get-config';
import getChangelog from './steps/04-get-changelog';
import getDependents from './steps/05-get-dependents';

export { getComponents, getExactVersion, getPackageJson, getConfig, getChangelog, getDependents };

export class Pipeline {
  static instance: Pipeline;
  private steps: PipelineStep[];

  private constructor() {
    this.steps = [];
  }

  static getInstance(): Pipeline {
    if (Pipeline.instance) {
      return Pipeline.instance;
    }

    Pipeline.instance = new Pipeline();
    return Pipeline.instance;
  }

  addStep(step: PipelineStep): Pipeline {
    this.steps.push(step);
    return this;
  }

  async run(source: string[], context: PipelineContext, reportProgress = false): Promise<PDiscoveryItem[]> {
    const discoveryItems: PDiscoveryItem[] = source.map((sourceItem) => ({
      name: sourceItem,
      nameWithoutPrefix: sourceItem.replace('@visual-framework/', ''),
    }));

    const processes: Listr.ListrTask<PDiscoveryItem[]>[] = discoveryItems.map((discoveryItem) => ({
      title: discoveryItem.nameWithoutPrefix || '',
      task: async (ctx) => {
        const result = await this.steps.reduce(
          async (previousPromise, fn) => fn(await previousPromise, context),
          Promise.resolve(discoveryItem),
        );

        ctx.push(result);
      },
    }));

    const tasks = new Listr(processes, {
      concurrent: 5,
      exitOnError: false,
      renderer: reportProgress ? 'default' : 'silent',
    });

    return await tasks.run([]);
  }
}
