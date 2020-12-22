import winston from 'winston';

export default class LoggerService {
  static instance: LoggerService;
  private logger: winston.Logger;

  static getInstance(): LoggerService {
    if (LoggerService.instance) {
      return LoggerService.instance;
    }

    LoggerService.instance = new LoggerService();
    return LoggerService.instance;
  }

  registerLogger(level: string, silent?: boolean): void {
    this.logger = winston.createLogger({
      silent,
      level,
      format: winston.format.simple(),
      transports: [
        new winston.transports.File({ filename: 'vf-core-service-discovery.log', level }),
        new winston.transports.Console(),
      ],
    });
  }

  getLogger(): winston.Logger {
    return this.logger;
  }
}
