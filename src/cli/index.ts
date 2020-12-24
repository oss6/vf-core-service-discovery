#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

import yargs from 'yargs';

yargs(process.argv.slice(2))
  .command(require('./run'))
  .command(require('./config'))
  .option({
    verbose: {
      description: 'Whether to show debug information in the cli',
      type: 'boolean',
      default: false,
      alias: 'v',
    },
    'log-file': {
      description: 'Specifies the log file location',
      type: 'string',
      default: 'vf-core-service-discovery.log',
      alias: 'l',
    },
  })
  .help().argv;
