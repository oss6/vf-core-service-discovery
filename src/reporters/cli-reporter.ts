import chalk from 'chalk';
import boxen from 'boxen';
import { DiscoveryItem, PipelineItem } from '../types';

export function printMainHeading(): void {
  console.log('\n');
  console.log(chalk.bold(boxen('vf-core-service-discovery\n\nVersion 0.1.0-beta.1', { padding: 1 })));
  console.log('\n');
}

export function report(items: PipelineItem[]): void {
  console.log('\n\n');

  for (const { discoveryItem: ds, profilingInformation } of items) {
    const discoveryItem = ds as DiscoveryItem;
    const isOldVersion = discoveryItem.version !== discoveryItem.packageJson.version;

    console.log(
      chalk.bold(
        `${discoveryItem.nameWithoutPrefix}${discoveryItem.config ? ` (${discoveryItem.config?.title})` : ''}\n`,
      ),
    );
    console.log(`  Used version\t\t${isOldVersion ? chalk.red(discoveryItem.version) : discoveryItem.version}`);
    console.log(
      `  Latest version\t${
        isOldVersion ? chalk.green(discoveryItem.packageJson.version) : discoveryItem.packageJson.version
      }`,
    );

    if (discoveryItem.config) {
      console.log(`  Status\t\t${discoveryItem.config.status}`);
    }

    if (discoveryItem.changelog?.length > 0) {
      console.log(`  Changelog`);
      console.log(
        `${discoveryItem.changelog
          .map((item) => `\n\t\t\t${item.version}${item.changes.map((c) => `\n\t\t\t  ${c}`).join('')}`)
          .join('')}`,
      );
    }

    console.log(`  Dependents${!discoveryItem.dependents?.length ? `\t\t${chalk.red('None')}` : ''}`);

    if (discoveryItem.dependents?.length > 0) {
      console.log(`${discoveryItem.dependents.map((dep) => `\n\t\t\t${dep}`).join('')}`);
    }

    if (
      Object.keys(profilingInformation).length > 0 &&
      Object.values(profilingInformation).some((p) => p !== undefined)
    ) {
      console.log(`  Profiling information`);
      console.log(
        `${Object.entries(profilingInformation)
          .filter(([_, took]) => took !== undefined)
          .map(([key, took]) => `\n\t\t\t${key}: ${took}`)
          .join('')}`,
      );
    }

    console.log(`\n\n`);
  }
}
