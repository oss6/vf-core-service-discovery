import { AppError } from '../errors';
import ConfigurationService from '../services/configuration';
import LoggerService from '../services/logger';
import { AppConfig } from '../types';

interface Arguments {
  verbose: boolean;
  'log-file': string;
  reset: boolean;
  key: string;
  value: string;
}

export const command = 'config [key] [value]';

export const describe = 'manage the configuration';

export const builder = {
  reset: {
    description: 'Reset configuration to defaults',
    type: 'boolean',
    default: false,
    alias: 'r',
  },
};

export function handler(argv: Arguments): void {
  const loggerService = LoggerService.getInstance();
  const configurationService = ConfigurationService.getInstance();

  const logger = loggerService.registerLogger(argv.verbose ? 'debug' : 'info', argv['log-file']);

  try {
    if (argv.reset) {
      configurationService.reset();
      return;
    }

    const validKeys = Object.getOwnPropertyNames(ConfigurationService.defaultAppConfig);
    const validKeysString = Object.keys(ConfigurationService.defaultAppConfig).join(', ');

    if (!argv.key) {
      throw new AppError(`You must provide a key: ${validKeysString}`);
    }

    configurationService.load();

    if (!validKeys.includes(argv.key)) {
      throw new AppError(`The key '${argv.key}' is not valid. Please choose one of: ${validKeysString}.`);
    }

    const key = argv.key as keyof AppConfig;
    const value = argv.value;

    if (!argv.value) {
      logger.info(configurationService.config[key]);
    } else {
      // TODO: deserialise with validation
      configurationService.update(key, value);
      logger.info('Configuration updated successfully.');
    }
  } catch (error) {
    logger.error(error.message);
  }
}
