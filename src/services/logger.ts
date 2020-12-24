import chalk from 'chalk';
import { Logger, createLogger, format, transports } from 'winston';

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
      format: format.simple(),
      transports: [
        new transports.File({ filename: logFile, level }),
        new transports.Console({
          format: printf(({ level, message }) => `${level === 'error' ? chalk.red(message) : message}`),
        }),
      ],
    });
  }

  getLogger(): Logger {
    return this.logger;
  }
}
