export class FileNotFoundError extends Error {
  constructor(fileName: string) {
    super(`${fileName} has not been found.`);
    this.name = 'FileNotFoundError';
  }
}

export class NoVfDependenciesFoundError extends Error {
  constructor(fileName: string) {
    super(`${fileName} does not contain any vf-core dependencies.`);
    this.name = 'NoVfDependenciesFoundError';
  }
}
