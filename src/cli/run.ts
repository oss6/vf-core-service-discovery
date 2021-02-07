import ServiceDiscovery from '..';
import { printMainHeading, report } from '../reporters/cli-reporter';

interface Arguments {
  verbose: boolean;
  'log-file': string;
  force: boolean;
  profile: boolean;
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

    report(items);
  } catch (error) {
    process.exit(1);
  }
}
