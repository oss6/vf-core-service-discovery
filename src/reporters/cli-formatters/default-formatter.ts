/* eslint-disable @typescript-eslint/no-unused-vars */
import chalk from 'chalk';
import { StringBuilder } from '../../helpers/string';
import { DiscoveryItem, PipelineItem } from '../../types';

function addComponentTitle(discoveryItem: DiscoveryItem, stringBuilder: StringBuilder) {
  stringBuilder.add(
    chalk.bold(`${discoveryItem.nameWithoutPrefix}${discoveryItem.config ? ` (${discoveryItem.config?.title})` : ''}`),
  );
}

function addData(data: Map<string, string[]>, stringBuilder: StringBuilder) {
  const indentationSize = 4;
  const keys = [...data.keys()];
  const maxLength = Math.max(...keys.map((key) => key.length));
  const keyColumnWidth = indentationSize + maxLength + 6;

  for (const [key, lines] of data.entries()) {
    const [firstLine, ...restLines] = lines;

    stringBuilder.addNewLine(1, true);
    stringBuilder.add(
      `|-- ${key}${Array(keyColumnWidth - (indentationSize + key.length))
        .fill(' ')
        .join('')}${firstLine}`,
    );
    stringBuilder.addNewLine();

    for (const line of restLines) {
      stringBuilder.add(
        `|${Array(keyColumnWidth - 1)
          .fill(' ')
          .join('')}${line}`,
      );
      stringBuilder.addNewLine();
    }

    stringBuilder.addNewLine(1, true);
  }

  stringBuilder.add(Array(keyColumnWidth).fill('-').join(''));
  stringBuilder.addNewLine(2);
}

export default function defaultFormatter(
  { discoveryItem: ds, profilingInformation }: PipelineItem,
  stringBuilder: StringBuilder,
): void {
  const discoveryItem = ds as DiscoveryItem;
  const data = new Map<string, string[]>();
  const isOldVersion = discoveryItem.version !== discoveryItem.packageJson.version;

  addComponentTitle(discoveryItem, stringBuilder);
  stringBuilder.addNewLine();

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

  addData(data, stringBuilder);
}
