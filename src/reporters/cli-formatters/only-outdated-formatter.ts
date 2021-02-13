import chalk from 'chalk';
import { StringBuilder } from '../../helpers/string';
import { DiscoveryItem, PipelineItem } from '../../types';

export default function onlyOutdatedFormatter({ discoveryItem: ds }: PipelineItem, stringBuilder: StringBuilder): void {
  const discoveryItem = ds as DiscoveryItem;

  if (discoveryItem.version === discoveryItem.packageJson.version) {
    return;
  }

  stringBuilder.add(
    chalk.bold(`${discoveryItem.nameWithoutPrefix}${discoveryItem.config ? ` (${discoveryItem.config?.title})` : ''}`),
  );

  stringBuilder.add(` (${chalk.red(discoveryItem.version)} -> ${chalk.green(discoveryItem.packageJson.version)})\n`);
}
