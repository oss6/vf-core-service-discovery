import { promisify } from 'util';
import glob from 'glob';
import path from 'path';
import fs from 'fs';
import { DependentMatcher, PackageJson, PDiscoveryItem, PotentialDependent, ProjectType } from '../types';
import LoggerService from './logger';
import { AppError } from '../errors';

const globP = promisify(glob);

type ProjectFilesFinder = (rootDirectory: string, ignore: string[]) => Promise<string[]>;

export default class DependentsService {
  static instance: DependentsService;
  private matchers = new Map<string, DependentMatcher>([
    ['html', this.basicMatcher],
    ['njk', this.basicMatcher],
    ['ts', this.basicMatcher],
    ['jsx', this.basicMatcher],
    ['tsx', this.basicMatcher],
  ]);
  private projectFilesMap = new Map<ProjectType, ProjectFilesFinder>([
    [ProjectType.html, this.htmlProjectFiles],
    [ProjectType.angular, this.angularProjectFiles],
    [ProjectType.react, this.reactProjectFiles],
  ]);
  private loggerService = LoggerService.getInstance();
  private logger = this.loggerService.getLogger();

  static getInstance(): DependentsService {
    if (DependentsService.instance) {
      return DependentsService.instance;
    }

    DependentsService.instance = new DependentsService();
    return DependentsService.instance;
  }

  async getPotentialDependents(
    rootDirectory: string,
    projectType: ProjectType,
    ignore: string[],
  ): Promise<PotentialDependent[]> {
    this.logger.debug('Getting potential dependents');

    const processedProjectType =
      projectType === ProjectType.autoDetect ? await this.detectProjectType(rootDirectory) : projectType;
    const fileTypeGetter = this.projectFilesMap.get(processedProjectType);

    if (!fileTypeGetter) {
      throw new AppError(`Project type '${projectType}' not recognised.`);
    }

    const filePaths = await fileTypeGetter(rootDirectory, ignore);

    return filePaths.map((filePath) => {
      const extension = path.extname(filePath).replace('.', '');
      const matcher = this.matchers.get(path.extname(filePath).replace('.', ''));

      if (!matcher) {
        throw new AppError(`Matcher not found for extension ${extension}.`);
      }

      return {
        filePath,
        matcher,
      };
    });
  }

  private async detectProjectType(rootDirectory: string): Promise<ProjectType> {
    try {
      await fs.promises.readFile(path.join(rootDirectory, 'angular.json'));
      return ProjectType.angular;
      // eslint-disable-next-line no-empty
    } catch (error) {}

    try {
      const packageJson: PackageJson = JSON.parse(
        await fs.promises.readFile(path.join(rootDirectory, 'package.json'), 'utf-8'),
      );

      if (packageJson.dependencies && Object.keys(packageJson.dependencies).includes('react')) {
        return ProjectType.react;
      }
    } catch (error) {
      throw new AppError('Could not open package.json file to detect project type.');
    }

    return ProjectType.html;
  }

  private async htmlProjectFiles(rootDirectory: string, ignore: string[]): Promise<string[]> {
    return globP(`${rootDirectory}/**/*.{html,njk}`, { ignore });
  }

  private async angularProjectFiles(rootDirectory: string, ignore: string[]): Promise<string[]> {
    return globP(`${rootDirectory}/**/*.{html,ts}`, { ignore });
  }

  private async reactProjectFiles(rootDirectory: string, ignore: string[]): Promise<string[]> {
    return globP(`${rootDirectory}/**/*.{jsx,tsx}`, { ignore });
  }

  private basicMatcher(discoveryItem: PDiscoveryItem, contents: string) {
    return discoveryItem.nameWithoutPrefix !== undefined && contents.includes(discoveryItem.nameWithoutPrefix);
  }
}
