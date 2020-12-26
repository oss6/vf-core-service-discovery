import runServiceDiscovery from '..';
import { printMainHeading, report } from '../reporters/cli-reporter';
import LoggerService from '../services/logger';
import { DiscoveryItem, Options } from '../types';

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
  const loggerService = LoggerService.getInstance();
  const logger = loggerService.registerLogger(argv.verbose ? 'debug' : 'info', argv['log-file']);

  try {
    const options: Options = {
      forceRun: argv.force,
      forceGitHubAuth: argv['force-github-auth'],
    };

    printMainHeading();

    const discoveryOutput = await runServiceDiscovery(options);

    report(discoveryOutput as DiscoveryItem[]);
  } catch (error) {
    logger.error(error.message);
  }
}
