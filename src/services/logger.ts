import chalk from 'chalk';
import { Logger, createLogger, format, transports } from 'winston';
import { Log } from '../types';

const { printf } = format;

export default class LoggerService {
  static instance: LoggerService;
  private logger: Logger;

  static getInstance(): LoggerService {
    if (LoggerService.instance) {
      return LoggerService.instance;
    }

    LoggerService.instance = new LoggerService();
    return LoggerService.instance;
  }

  registerLogger(level: string, logFile: string, silent?: boolean): void {
    this.logger = createLogger({
      silent,
      level,
      format: format.json(),
      transports: [
        new transports.File({ filename: logFile, level: 'debug' }),
        new transports.Console({
          level: level === 'debug' ? 'debug' : 'warn',
          format: printf(({ level, message }) => `${level === 'error' ? chalk.red(message) : message}`),
        }),
      ],
    });
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  log(level: string, data: string | Omit<Log, 'level' | 'timestamp' | 'caller'>, caller: Function): void {
    const timestamp = new Date().toISOString();

    if (typeof data === 'string') {
      this.logger.log(level, {
        level,
        message: data,
        timestamp,
        caller: caller.name,
      } as Log);
    } else {
      this.logger.log(level, {
        ...data,
        level,
        timestamp,
        caller: caller.name,
      } as Log);
    }
  }
}
