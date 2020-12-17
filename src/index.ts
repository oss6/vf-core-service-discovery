import fs from 'fs';
import path from 'path';
import { DiscoveryItem, Options } from './types';
import { cloneRepository } from './git-client';
import { getLogger } from './logger';
import App from './app';
import { asyncFlow } from './helpers';

export async function discover(options: Options): Promise<DiscoveryItem[]> {
  const app = App.getInstance(options);
  const logger = getLogger();

  await app.setupConfiguration();

  if (options.forceRun || app.shouldInvalidate()) {
    logger.debug('Started invalidation');

    await cloneRepository('https://github.com/visual-framework/vf-core.git', app.getAppDirectory('vf-core'));

    logger.debug('vf-core cloned successfully');

    app.updateLastInvalidation(new Date());
  }

  logger.debug('Running service discovery');

  const pipeline = await Promise.all(
    fs
      .readdirSync(path.join(__dirname, 'pipeline'))
      .filter((fileName) => fileName.endsWith('.js'))
      .map(async (fileName) => (await import(`./pipeline/${fileName}`)).default),
  );

  const discoveryItems = (await asyncFlow(...pipeline)) as DiscoveryItem[];

  return discoveryItems;
}
