/* eslint-disable @typescript-eslint/no-var-requires */
import chalk from 'chalk';
import boxen from 'boxen';
import ServiceDiscovery from '..';
import { Reporter } from '../types';

interface Arguments {
  verbose: boolean;
  'log-file': string;
  force: boolean;
  profile: boolean;
  reporters: string[];
}

function printMainHeading(): void {
  console.log('\n');
  console.log(chalk.bold(boxen('vf-core-service-discovery\n\nVersion 0.1.0-beta.1', { padding: 1 })));
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
      profile: argv.profile,
    });

    const items = await serviceDiscovery.run(true);

    const reporters: Reporter[] = argv.reporters.map(
      (reporter) => require(`../reporters/${reporter}-reporter`).default,
    );

    for (const report of reporters) {
      await report(items);
    }
  } catch (error) {
    process.exit(1);
  }
}
