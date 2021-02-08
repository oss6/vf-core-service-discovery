import chalk from 'chalk';
import OptionsService from '../services/options';
import { DiscoveryItem, PipelineItem } from '../types';

const stringBuilder = {
  value: '',
  add(str: string): void {
    this.value += str;
  },
  reset(): void {
    this.value = '';
  },
};

function addComponentTitle(discoveryItem: DiscoveryItem) {
  stringBuilder.add(
    chalk.bold(`${discoveryItem.nameWithoutPrefix}${discoveryItem.config ? ` (${discoveryItem.config?.title})` : ''}`),
  );
}

function addNewLine(n = 1, withSeparator = false) {
  stringBuilder.add(`${withSeparator ? '|' : ''}${Array(n).fill('\n').join('')}`);
}

function addData(data: Map<string, string[]>) {
  const indentationSize = 4;
  const keys = [...data.keys()];
  const maxLength = Math.max(...keys.map((key) => key.length));
  const keyColumnWidth = indentationSize + maxLength + 6;

  for (const [key, lines] of data.entries()) {
    const [firstLine, ...restLines] = lines;

    addNewLine(1, true);
    stringBuilder.add(
      `|-- ${key}${Array(keyColumnWidth - (indentationSize + key.length))
        .fill(' ')
        .join('')}${firstLine}`,
    );
    addNewLine();

    for (const line of restLines) {
      stringBuilder.add(
        `|${Array(keyColumnWidth - 1)
          .fill(' ')
          .join('')}${line}`,
      );
      addNewLine();
    }

    addNewLine(1, true);
  }

  stringBuilder.add(Array(keyColumnWidth).fill('-').join(''));
  addNewLine(2);
}

function defaultFormatter({ discoveryItem: ds, profilingInformation }: PipelineItem) {
  const discoveryItem = ds as DiscoveryItem;
  const data = new Map<string, string[]>();
  const isOldVersion = discoveryItem.version !== discoveryItem.packageJson.version;

  addComponentTitle(discoveryItem);
  addNewLine();

  data.set('Used version', [`${isOldVersion ? chalk.red(discoveryItem.version) : discoveryItem.version}`]);
  data.set('Latest version', [
    `${isOldVersion ? chalk.green(discoveryItem.packageJson.version) : discoveryItem.packageJson.version}`,
  ]);

  if (discoveryItem.config) {
    data.set('Status', [`${discoveryItem.config.status}`]);
  }

  if (discoveryItem.changelog?.length > 0) {
    data.set('Changelog', discoveryItem.changelog.map((item) => [`${chalk.bold(item.version)}`, item.changes]).flat(2));
  }

  if (discoveryItem.dependents) {
    data.set('Dependents', discoveryItem.dependents.length > 0 ? discoveryItem.dependents : [chalk.red('None')]);
  }

  if (
    Object.keys(profilingInformation).length > 0 &&
    Object.values(profilingInformation).some((p) => p !== undefined)
  ) {
    data.set(
      'Profiling information',
      Object.entries(profilingInformation)
        .filter(([_, took]) => took !== undefined)
        .map(([key, took]) => `${key}: ${took}`),
    );
  }

  addData(data);
}

function onlyOutdatedFormatter({ discoveryItem: ds }: PipelineItem) {
  const discoveryItem = ds as DiscoveryItem;

  if (discoveryItem.version === discoveryItem.packageJson.version) {
    return;
  }

  stringBuilder.add(
    chalk.bold(`${discoveryItem.nameWithoutPrefix}${discoveryItem.config ? ` (${discoveryItem.config?.title})` : ''}`),
  );

  stringBuilder.add(` (${chalk.red(discoveryItem.version)} -> ${chalk.green(discoveryItem.packageJson.version)})\n`);
}

export default async function report(items: PipelineItem[]): Promise<void> {
  const optionsService = OptionsService.getInstance();
  const { onlyOutdated } = optionsService.getOptions();

  addNewLine(2);

  for (const pipelineItem of items) {
    if (onlyOutdated) {
      onlyOutdatedFormatter(pipelineItem);
    } else {
      defaultFormatter(pipelineItem);
    }
  }

  console.log(stringBuilder.value);
}
