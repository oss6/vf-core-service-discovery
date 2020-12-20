import { Logger } from 'winston';
import { getLogger } from '../logger';
import { Options } from '../types';

export class OptionsService {
  static instance: OptionsService;
  private options: Options;
  private logger: Logger = getLogger();

  static getInstance(): OptionsService {
    if (OptionsService.instance) {
      return OptionsService.instance;
    }

    OptionsService.instance = new OptionsService();
    return OptionsService.instance;
  }

  setOptions(options: Options): void {
    this.options = options;
  }

  getOptions(): Options {
    return this.options;
  }
}
