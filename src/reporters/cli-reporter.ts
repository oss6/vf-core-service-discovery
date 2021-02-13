import { StringBuilder } from '../helpers/string';
import OptionsService from '../services/options';
import { PipelineItem } from '../types';
import customFormatter from './cli-formatters/custom-formatter';
import defaultFormatter from './cli-formatters/default-formatter';
import onlyOutdatedFormatter from './cli-formatters/only-outdated-formatter';

export default async function report(items: PipelineItem[], format: string): Promise<void> {
  const stringBuilder = StringBuilder.getInstance();
  const optionsService = OptionsService.getInstance();
  const { onlyOutdated } = optionsService.getOptions();

  stringBuilder.reset();
  stringBuilder.addNewLine(2);

  for (const pipelineItem of items) {
    if (onlyOutdated) {
      onlyOutdatedFormatter(pipelineItem, stringBuilder);
    } else if (format) {
      customFormatter(pipelineItem, format, stringBuilder);
    } else {
      defaultFormatter(pipelineItem, stringBuilder);
    }
  }

  console.log(stringBuilder.getValue());
}
