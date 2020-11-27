#!/usr/bin/env node

import { discover } from './index';

async function run() {
  const rootDirectory = process.cwd();

  const discoveryOutput = await discover(rootDirectory);

  console.log(discoveryOutput);
}

run();
