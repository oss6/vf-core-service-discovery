import winston from 'winston';

let logger: winston.Logger;

export function registerLogger(level: string): void {
  logger = winston.createLogger({
    level,
    format: winston.format.simple(),
    transports: [
      new winston.transports.File({ filename: 'vf-core-service-discovery.log', level }),
      new winston.transports.Console(),
    ],
  });
}

export function getLogger(): winston.Logger {
  return logger;
}
