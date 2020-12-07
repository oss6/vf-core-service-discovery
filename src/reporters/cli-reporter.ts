import chalk from 'chalk';
import boxen from 'boxen';
import { DiscoveryItem } from '../definitions';

export function printMainHeading() {
  console.log('\n');
  console.log(chalk.bold(boxen('vf-core-service-discovery\n\nVersion 0.1.0', { padding: 1 })));
  console.log('\n');
}

export function report(discoveryItems: DiscoveryItem[]) {
  for (const discoveryItem of discoveryItems) {
    const isOldVersion = discoveryItem.version !== discoveryItem.packageJson.version;

    console.log(chalk.bold(`${discoveryItem.nameWithoutPrefix} (${discoveryItem.config.title})\n`));
    console.log(`  Used version\t\t${isOldVersion ? chalk.red(discoveryItem.version) : discoveryItem.version}`);
    console.log(`  Latest version\t${isOldVersion ? chalk.green(discoveryItem.packageJson.version) : discoveryItem.packageJson.version}`);
    console.log(`  Status\t\t${discoveryItem.config.status}`);

    if (discoveryItem.changelog.length > 0) {
      console.log(`  Changelog`);
      console.log(`${discoveryItem.changelog.map(item => `\n\t\t\t${item.version}${item.changes.map(c => `\n\t\t\t  ${c}`).join('')}`).join('')}`);
    }

    console.log(`\n\n`);
  }
}
