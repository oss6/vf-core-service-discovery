/* eslint-disable @typescript-eslint/no-var-requires */
import { promisify } from 'util';
import path from 'path';
import chalk from 'chalk';
import boxen from 'boxen';
import rimraf from 'rimraf';
import compareVersions from 'vf-core-service-discovery-versions-comparison';
import ServiceDiscovery from '..';
import { Reporter } from '../types';
import { PassThrough } from 'stream';

const rimrafP = promisify(rimraf);

interface Arguments {
  verbose: boolean;
  'log-file': string;
  force: boolean;
  profile: boolean;
  'only-outdated': boolean;
  'compare-versions': boolean;
  reporters: string[];
  disabled: string[];
  format: string;
}

function printMainHeading(): void {
  console.log('\n');
  console.log(chalk.bold(boxen('vf-core-service-discovery\n\nVersion 0.1.0-beta.4', { padding: 1 })));
  console.log('\n');
}

export const command = 'run';

export const describe = 'run service discovery';

export const builder = {
  force: {
    description: 'By-pass the cache',
    type: 'boolean',
    default: false,
    alias: 'f',
  },
  profile: {
    description: 'Return profiling information',
    type: 'boolean',
    default: false,
    alias: 'p',
  },
  reporters: {
    description: 'Reporters to use',
    type: 'array',
    default: ['cli'],
    alias: 'r',
  },
  disabled: {
    description: 'List of disabled steps (from getConfig, getChangelog, getDependents)',
    type: 'array',
    default: [],
    alias: 'd',
  },
  'only-outdated': {
    description: 'Display only outdated components',
    type: 'boolean',
    default: false,
    alias: 'o',
  },
  format: {
    description: 'Defines the CLI output format',
    type: 'string',
    default: '',
    alias: 'm',
  },
  'compare-versions': {
    description: "Compare components' versions",
    type: 'boolean',
    default: false,
    alias: 'c',
  },
};

export async function handler(argv: Arguments): Promise<void> {
  try {
    printMainHeading();

    const serviceDiscovery = ServiceDiscovery.getInstance();

    await serviceDiscovery.setup({
      forceRun: argv.force,
      verbose: argv.verbose,
      logFile: argv['log-file'],
      loggingEnabled: true,
      onlyOutdated: argv['only-outdated'],
      profile: argv.profile,
      disabled: argv['only-outdated'] ? ['getConfig', 'getChangelog', 'getDependents'] : argv.disabled,
    });

    const items = await serviceDiscovery.run(true);

    const reporters: Reporter[] = argv.reporters.map(
      (reporter) => require(`../reporters/${reporter}-reporter`).default,
    );

    for (const report of reporters) {
      await report(items, argv.format);
    }

    const discoveryItemsForComparison = items
      .map((item) => item.discoveryItem)
      .filter((item) => item.version !== item.packageJson?.version);

    if (argv['compare-versions'] && discoveryItemsForComparison.length > 0) {
      const temporaryWebServerFilesDirectory = path.join(process.cwd(), 'vf-core-service-discovery-tmp');
      const logStream = new PassThrough({ encoding: 'utf-8' });

      logStream.on('data', (data) => {
        console.log(data);
      });

      await compareVersions(
        temporaryWebServerFilesDirectory,
        {
          components: discoveryItemsForComparison.map((item) => ({
            name: item.name,
            nameWithoutPrefix: item.nameWithoutPrefix,
            installedVersion: item.version,
            latestVersion: item.packageJson?.version,
          })),
        },
        logStream,
      );

      // TODO: check windows
      process.on('SIGINT', async () => {
        console.log(`Deleting temporary web server files directory: ${temporaryWebServerFilesDirectory}`);
        await rimrafP(temporaryWebServerFilesDirectory);
        process.exit();
      });
    }
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}
