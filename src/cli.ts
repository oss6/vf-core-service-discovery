#!/usr/bin/env node

import yargs from 'yargs';
import { Options } from './types';
import { discover } from './index';
import { registerLogger } from './logger';
import { printMainHeading, report } from './reporters/cli-reporter';

async function run() {
  const argv = yargs(process.argv.slice(2)).options({
    verbose: {
      description: 'Whether to show debug information in the cli',
      type: 'boolean',
      default: false,
      alias: 'v'
    },
    force: {
      description: 'By-pass the cache',
      type: 'boolean',
      default: false,
      alias: 'f'
    }
  }).argv;

  const loggingLevel = argv.verbose ? 'debug' : 'info';

  registerLogger(loggingLevel);

  printMainHeading();

  const options: Options = {
    forceRun: argv.force
  };

  const discoveryOutput = await discover(options);

  report(discoveryOutput);
}

run();
