import { ErrorLog } from './types';

export class AppError extends Error {
  details: string[] = [];

  constructor(message: string, details: string[] = []) {
    super(message);
    this.name = 'AppError';
    this.details = details;
  }
}

export class FileNotFoundError extends AppError {
  constructor(fileName: string) {
    super(`${fileName} has not been found.`);
    this.name = 'FileNotFoundError';
  }
}

export class NoVfDependenciesFoundError extends AppError {
  constructor(fileName: string) {
    super(`${fileName} does not contain any vf-core dependencies.`);
    this.name = 'NoVfDependenciesFoundError';
  }
}

export class MissingConfigurationError extends AppError {
  constructor(keys: string[]) {
    super(
      `Configuration keys ${keys.join(', ')} have not been defined. Run \`vf-core-service-discovery --reset-config\`.`,
    );
    this.name = 'MissingConfigurationError';
  }
}

export function errorLog(error: Error): ErrorLog {
  return {
    type: error.name,
    message: error.message,
    level: 'error',
    details: error instanceof AppError ? error.details : [],
  };
}
