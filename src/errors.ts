export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppError';
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
