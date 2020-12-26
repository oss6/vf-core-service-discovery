import getContext from '../context';
import { DiscoveryItem, PipelineStep } from '../types';

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

  async run(source: string[]): Promise<Partial<DiscoveryItem>[]> {
    const context = getContext();
    const discoveryItems: Partial<DiscoveryItem>[] = source.map((sourceItem) => ({
      name: sourceItem,
      nameWithoutPrefix: sourceItem.replace(`${context.vfPackagePrefix}/`, ''),
    }));

    const processes = discoveryItems.map((discoveryItem) =>
      this.steps.reduce(async (previousPromise, fn) => fn(await previousPromise), Promise.resolve(discoveryItem)),
    );

    return await Promise.all(processes);
  }
}
