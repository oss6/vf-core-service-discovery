#!/usr/bin/env node

import yargs from 'yargs';
import { Options } from './types';
import { getLogger, registerLogger } from './logger';
import { printMainHeading, report } from './reporters/cli-reporter';
import runServiceDiscovery from '.';

async function run() {
  try {
    const argv = yargs(process.argv.slice(2)).options({
      verbose: {
        description: 'Whether to show debug information in the cli',
        type: 'boolean',
        default: false,
        alias: 'v',
      },
      force: {
        description: 'By-pass the cache',
        type: 'boolean',
        default: false,
        alias: 'f',
      },
    }).argv;

    const loggingLevel = argv.verbose ? 'debug' : 'info';

    registerLogger(loggingLevel);

    printMainHeading();

    const options: Options = {
      forceRun: argv.force,
    };

    // const app = App.getInstance(options);

    // const discoveryOutput = await app.runServiceDiscovery();

    const discoveryOutput = await runServiceDiscovery(options);

    report(discoveryOutput);
  } catch (error) {
    const logger = getLogger();

    logger.error(error.message);
  }
}

run();
