#!/usr/bin/env node

import yargs from 'yargs';
import { discover } from './index';
import { registerLogger } from './logger';
import { printMainHeading, report } from './reporters/cli-reporter';

async function run() {
  const argv = yargs(process.argv.slice(2)).options({
    verbose: { type: 'boolean', default: false }
  }).argv;

  const loggingLevel = argv.verbose ? 'debug' : 'info';

  registerLogger(loggingLevel);

  printMainHeading();

  const rootDirectory = process.cwd();

  const discoveryOutput = await discover(rootDirectory);

  report(discoveryOutput);
}

run();
