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

export class GitHubAuthenticationError extends AppError {
  constructor(message = '') {
    super(message || 'An error has occurred while authenticating to GitHub.');
    this.name = 'GitHubAuthenticationError';
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
