import { promisify } from 'util';
import glob from 'glob';
import path from 'path';
import { DependentMatcher, PDiscoveryItem, PotentialDependent } from '../types';

const globP = promisify(glob);

export default class DependentsService {
  static instance: DependentsService;
  static matchers: { [key: string]: DependentMatcher } = {
    html(discoveryItem: PDiscoveryItem, contents: string) {
      return discoveryItem.nameWithoutPrefix !== undefined && contents.includes(discoveryItem.nameWithoutPrefix);
    },
  };
  // private loggerService = LoggerService.getInstance();
  // private logger = this.loggerService.getLogger();

  static getInstance(): DependentsService {
    if (DependentsService.instance) {
      return DependentsService.instance;
    }

    DependentsService.instance = new DependentsService();
    return DependentsService.instance;
  }

  async getPotentialDependents(
    rootDirectory: string,
    fileTypes: string[],
    ignore: string[],
  ): Promise<PotentialDependent[]> {
    const filePaths = await globP(`${rootDirectory}/**/*.{${fileTypes.join(',')}}`, { ignore });

    return filePaths.map((filePath) => ({
      filePath,
      matcher: DependentsService.matchers[path.extname(filePath).replace('.', '')],
    }));
  }
}
