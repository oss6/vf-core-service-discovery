import open from 'open';
import ServiceDiscovery from '..';
import { sleep } from '../helpers';
import { printMainHeading, report } from '../reporters/cli-reporter';
import { DiscoveryItem } from '../types';

interface Arguments {
  verbose: boolean;
  'log-file': string;
  force: boolean;
  'force-github-auth': boolean;
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
  'force-github-auth': {
    description: 'Force GitHub authentication',
    type: 'boolean',
    default: false,
    alias: 'g',
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
    });

    const discoveryItems = await serviceDiscovery.run();

    report(discoveryItems as DiscoveryItem[]);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}
