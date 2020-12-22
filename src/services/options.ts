import { Options } from '../types';

export default class OptionsService {
  static instance: OptionsService;
  private options: Options;

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
