import open from 'open';
import ServiceDiscovery from '..';
import { sleep } from '../helpers';
import { printMainHeading, report } from '../reporters/cli-reporter';
import { DiscoveryItem, GitHubDeviceLogin } from '../types';

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

    serviceDiscovery.setup({
      forceRun: argv.force,
      // forceGitHubAuth: argv['force-github-auth'],
      verbose: argv.verbose,
      logFile: argv['log-file'],
      loggingEnabled: true,
    });

    // let setupResult = await setupGenerator.next();

    // if (!setupResult.done) {
    //   const { expiresIn, userCode, verificationUri } = setupResult.value as GitHubDeviceLogin;
    //   const expiry = Math.floor(expiresIn / 60);

    //   console.log(`Please enter the code ${userCode} at ${verificationUri}. This expires in ${expiry} minutes.`);

    //   await sleep(2000);
    //   await open(verificationUri);

    //   setupResult = await setupGenerator.next();
    // }

    const discoveryItems = await serviceDiscovery.run();

    report(discoveryItems as DiscoveryItem[]);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}
