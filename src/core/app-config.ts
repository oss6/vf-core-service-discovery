import fs from 'fs';
import os from 'os';
import path from 'path';
import { compareAsc, format } from 'date-fns';
import { parseRelativeTime } from './helpers';

// export class App {
//   config: AppConfig;

//   static getAppDirectory(...segments: string[]): string {
//     return path.join(os.homedir(), '.vf-core-service-discovery', ...segments);
//   }

//   static getAppConfigFileName(): string {
//     return path.join(App.getAppDirectory(), 'config.json');
//   }

//   createAppDirectoryIfNotExistent(): AppConfig {
//     const appDirectory = App.getAppDirectory();
//     const appConfigFileName = App.getAppConfigFileName();
//     let appConfig: AppConfig = defaultAppConfig;

//     if (!fs.existsSync(appDirectory) && !fs.existsSync(appConfigFileName)) {
//       console.log('not exists');
//       fs.mkdirSync(appDirectory);
//       fs.writeFileSync(appConfigFileName, JSON.stringify(appConfig));
//     } else {
//       console.log('exists');
//       appConfig = JSON.parse(fs.readFileSync(appConfigFileName, 'utf-8'));
//       console.log(appConfig);
//     }

//     return appConfig;
//   }
// }

export interface AppConfig {
  cacheExpiry: string;
  lastInvalidation: Date | null;
}

export const defaultAppConfig: AppConfig = {
  cacheExpiry: '5h',
  lastInvalidation: null
};

export function getAppDirectory(...segments: string[]): string {
  return path.join(os.homedir(), '.vf-core-service-discovery', ...segments);
}

export function getAppConfigFileName(): string {
  return path.join(getAppDirectory(), 'config.json');
}

export function createAppDirectoryIfNotExistent(): AppConfig {
  const appDirectory = getAppDirectory();
  const appConfigFileName = getAppConfigFileName();
  let appConfig: AppConfig = defaultAppConfig;

  if (!fs.existsSync(appDirectory) && !fs.existsSync(appConfigFileName)) {
    console.log('not exists');
    fs.mkdirSync(appDirectory);
    fs.writeFileSync(appConfigFileName, JSON.stringify(appConfig));
  } else {
    console.log('exists');
    appConfig = JSON.parse(fs.readFileSync(appConfigFileName, 'utf-8'));
    console.log(appConfig);
  }

  return appConfig;
}

export function serializeAppConfig(appConfig: AppConfig): string {
  return JSON.stringify({
    ...appConfig,
    lastInvalidation: appConfig.lastInvalidation !== null
      ? format(appConfig.lastInvalidation, 'yyyy-MM-ddTHH:mm:ss')
      : null
  });
}

export function deserializeAppConfig(appConfig: string): AppConfig {
  const appConfigObject = JSON.parse(appConfig);

  return {
    ...appConfigObject,
    lastInvalidation: appConfigObject.lastInvalidation
      ? new Date(appConfigObject.lastInvalidation)
      : null
  };
}

export function shouldInvalidate(appConfig: AppConfig): boolean {
  const now = new Date();

  return appConfig.lastInvalidation === null
    || compareAsc(now, parseRelativeTime(appConfig.cacheExpiry, appConfig.lastInvalidation)) < 0;
}
