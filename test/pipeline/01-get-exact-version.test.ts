import anyTest, { TestInterface } from 'ava';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';
import getExactVersion, { parseLockFile } from '../../src/pipeline/steps/01-get-exact-version';
import { LockObject, PDiscoveryItem, PipelineContext } from '../../src/types';
import LoggerService from '../../src/services/logger';
import OptionsService from '../../src/services/options';

interface Context {
  sinonSandbox: sinon.SinonSandbox;
}

const test = anyTest as TestInterface<Context>;

test.serial.before((t) => {
  t.context.sinonSandbox = sinon.createSandbox();
});

test.serial.afterEach((t) => {
  t.context.sinonSandbox.restore();
  sinon.restore();
});

test.serial('parseLockFile should correctly parse an npm lock file', async (t) => {
  // arrange
  const lockFile = {
    name: 'vf-core-service-discovery-example',
    version: '1.0.0',
    lockfileVersion: 1,
    requires: true,
    dependencies: {
      '@visual-framework/vf-box': {
        version: '2.2.0',
        resolved: 'test',
        integrity: 'test',
      },
      '@visual-framework/vf-footer': {
        version: '1.1.0',
        resolved: 'test',
        integrity: 'test',
      },
      '@visual-framework/vf-grid': {
        version: '1.0.3',
        resolved: 'test',
        integrity: 'test',
      },
    },
  };
  const context: PipelineContext = {
    rootDirectory: '/test',
    cache: {
      components: {},
      lockObjects: {},
    },
    potentialDependents: [],
    vfPackagePrefix: '@visual-framework',
  };
  const lockFileName = path.join(context.rootDirectory, 'package-lock.json');
  const fsReadFileStub = t.context.sinonSandbox
    .stub(fs.promises, 'readFile')
    .withArgs(lockFileName, 'utf-8')
    .resolves(JSON.stringify(lockFile));

  // act
  const parsedLockFile = await parseLockFile(context);

  // assert
  t.deepEqual(parsedLockFile, lockFile.dependencies);
  t.true(fsReadFileStub.calledOnce);
});

test.serial('parseLockFile should correctly parse a yarn lock file', async (t) => {
  // arrange
  const expectedLockFile: LockObject = {
    '@visual-framework/vf-box': {
      version: '2.2.0',
      resolved: 'test',
      integrity: 'test',
    },
    '@visual-framework/vf-card': {
      version: '1.3.0',
      resolved: 'test',
      integrity: 'test',
    },
  };
  const context: PipelineContext = {
    rootDirectory: '/test',
    cache: {
      components: {},
      lockObjects: {},
    },
    potentialDependents: [],
    vfPackagePrefix: '@visual-framework',
    packageJson: {
      version: '2.1.3',
      dependencies: {
        '@visual-framework/vf-box': '2.2.0',
        '@visual-framework/vf-card': '1.3.0',
      },
    },
  };
  const fsReadFileStub = t.context.sinonSandbox.stub(fs.promises, 'readFile');

  fsReadFileStub.onCall(0).rejects({ code: 'ENOENT' });
  fsReadFileStub.onCall(1).resolves(`
"@visual-framework/vf-box@^2.3.0":
  version "2.3.0"
  resolved "test"
  integrity test

"@visual-framework/vf-box@2.2.0":
  version "2.2.0"
  resolved "test"
  integrity test

"@visual-framework/vf-card@1.3.0":
  version "1.3.0"
  resolved "test"
  integrity test

"@visual-framework/vf-card@^2.3.3":
  version "2.3.3"
  resolved "test"
  integrity test
  `);

  // act
  const parsedLockFile = await parseLockFile(context);

  // assert
  t.deepEqual(parsedLockFile, expectedLockFile);
  t.true(fsReadFileStub.calledTwice);
});

test.serial('parseLockFile should throw an error if no lock file has been found', async (t) => {
  // arrange
  const context: PipelineContext = {
    rootDirectory: '/test',
    cache: {
      components: {},
      lockObjects: {},
    },
    potentialDependents: [],
    vfPackagePrefix: '@visual-framework',
  };
  const fsReadFileStub = t.context.sinonSandbox.stub(fs.promises, 'readFile');

  fsReadFileStub.onCall(0).rejects({ code: 'ENOENT' });
  fsReadFileStub.onCall(1).rejects({ code: 'ENOENT' });

  // act
  const error = await t.throwsAsync(parseLockFile(context));

  // assert
  t.true(fsReadFileStub.calledTwice);
  t.is(error.name, 'FileNotFoundError');
});

test.serial('parseLockFile should throw an error if reading the npm lock file throws an error', async (t) => {
  // arrange
  const context: PipelineContext = {
    rootDirectory: '/test',
    cache: {
      components: {},
      lockObjects: {},
    },
    potentialDependents: [],
    vfPackagePrefix: '@visual-framework',
  };
  const fsReadFileStub = t.context.sinonSandbox.stub(fs.promises, 'readFile');

  fsReadFileStub.onCall(0).rejects(new Error('Generic error'));

  // act
  const error = await t.throwsAsync(parseLockFile(context));

  // assert
  t.true(fsReadFileStub.calledOnce);
  t.is(error.message, 'Generic error');
});

test.serial('parseLockFile should throw an error if reading the yarn lock file throws an error', async (t) => {
  // arrange
  const context: PipelineContext = {
    rootDirectory: '/test',
    cache: {
      components: {},
      lockObjects: {},
    },
    potentialDependents: [],
    vfPackagePrefix: '@visual-framework',
  };
  const fsReadFileStub = t.context.sinonSandbox.stub(fs.promises, 'readFile');

  fsReadFileStub.onCall(0).rejects({ code: 'ENOENT' });
  fsReadFileStub.onCall(1).rejects(new Error('Generic error'));

  // act
  const error = await t.throwsAsync(parseLockFile(context));

  // assert
  t.true(fsReadFileStub.calledTwice);
  t.is(error.message, 'Generic error');
});

test.serial('getExactVersion should return the exact version of the input component', async (t) => {
  // arrange
  const optionsService = OptionsService.getInstance();
  optionsService.setOptions({
    forceRun: true,
    logFile: '',
    loggingEnabled: false,
    verbose: false,
    profile: false,
    disabled: [],
    onlyOutdated: false,
    dependentsIgnore: [],
    dependentsProjectType: 'autoDetect',
  });

  const loggerService = LoggerService.getInstance();
  loggerService.registerLogger('debug', 'test.log', true);

  const lockFile = {
    name: 'vf-core-service-discovery-example',
    version: '1.0.0',
    lockfileVersion: 1,
    requires: true,
    dependencies: {
      '@visual-framework/vf-box': {
        version: '2.2.0',
        resolved: 'test',
        integrity: 'test',
      },
      '@visual-framework/vf-footer': {
        version: '1.1.0',
        resolved: 'test',
        integrity: 'test',
      },
      '@visual-framework/vf-grid': {
        version: '1.0.3',
        resolved: 'test',
        integrity: 'test',
      },
    },
  };
  const rootDirectory = '/test';
  const lockFileName = path.join(rootDirectory, 'package-lock.json');

  const fsReadFileStub = t.context.sinonSandbox.stub(fs.promises, 'readFile');
  fsReadFileStub.withArgs(lockFileName, 'utf-8').resolves(JSON.stringify(lockFile));

  const inputDiscoveryItem: PDiscoveryItem = {
    name: '@visual-framework/vf-box',
    nameWithoutPrefix: 'vf-box',
  };
  const context: PipelineContext = {
    rootDirectory: '/test',
    vfPackagePrefix: '@visual-framework',
    cache: {
      components: {},
      lockObjects: {},
    },
    potentialDependents: [],
  };

  // t.context.sinonSandbox.stub(os, 'homedir').returns('/');

  // act
  const { discoveryItem } = await getExactVersion(
    {
      discoveryItem: inputDiscoveryItem,
      profilingInformation: {},
    },
    context,
  );

  // assert
  t.deepEqual(discoveryItem, {
    name: '@visual-framework/vf-box',
    nameWithoutPrefix: 'vf-box',
    version: '2.2.0',
  });
  t.true(fsReadFileStub.calledOnce);
});

test.serial('getExactVersion should throw an error when it could not retrieve the exact version', async (t) => {
  // arrange
  const optionsService = OptionsService.getInstance();
  optionsService.setOptions({
    forceRun: true,
    logFile: '',
    loggingEnabled: false,
    verbose: false,
    profile: false,
    disabled: [],
    onlyOutdated: false,
    dependentsIgnore: [],
    dependentsProjectType: 'autoDetect',
  });

  const loggerService = LoggerService.getInstance();
  loggerService.registerLogger('debug', 'test.log', true);

  const lockFile = {
    name: 'vf-core-service-discovery-example',
    version: '1.0.0',
    lockfileVersion: 1,
    requires: true,
    dependencies: {
      '@visual-framework/vf-footer': {
        version: '1.1.0',
        resolved: 'test',
        integrity: 'test',
      },
      '@visual-framework/vf-grid': {
        version: '1.0.3',
        resolved: 'test',
        integrity: 'test',
      },
    },
  };
  const rootDirectory = '/test';
  const lockFileName = path.join(rootDirectory, 'package-lock.json');

  const fsReadFileStub = t.context.sinonSandbox.stub(fs.promises, 'readFile');
  fsReadFileStub.withArgs(lockFileName, 'utf-8').resolves(JSON.stringify(lockFile));

  const inputDiscoveryItem: PDiscoveryItem = {
    name: '@visual-framework/vf-box',
    nameWithoutPrefix: 'vf-box',
  };
  const context: PipelineContext = {
    rootDirectory: '/test',
    vfPackagePrefix: '@visual-framework',
    cache: {
      components: {},
      lockObjects: {},
    },
    potentialDependents: [],
  };

  // act
  const error = await t.throwsAsync(
    getExactVersion(
      {
        discoveryItem: inputDiscoveryItem,
        profilingInformation: {},
      },
      context,
    ),
  );

  // assert
  t.is(error.name, 'AppError');
  t.true(fsReadFileStub.calledOnce);
});

test.serial('getExactVersion should return the exact version of the input component from the cache', async (t) => {
  // arrange
  const optionsService = OptionsService.getInstance();
  optionsService.setOptions({
    forceRun: false,
    logFile: '',
    loggingEnabled: false,
    verbose: false,
    profile: false,
    disabled: [],
    onlyOutdated: false,
    dependentsIgnore: [],
    dependentsProjectType: 'autoDetect',
  });

  const loggerService = LoggerService.getInstance();
  loggerService.registerLogger('debug', 'test.log', true);

  const inputDiscoveryItem: PDiscoveryItem = {
    name: '@visual-framework/vf-box',
    nameWithoutPrefix: 'vf-box',
  };

  const rootDirectory = '/test';

  const context: PipelineContext = {
    rootDirectory,
    vfPackagePrefix: '@visual-framework',
    cache: {
      components: {},
      lockObjects: {
        [rootDirectory]: {
          '@visual-framework/vf-box': {
            version: '2.2.0',
            resolved: 'test',
            integrity: 'test',
          },
          '@visual-framework/vf-footer': {
            version: '1.1.0',
            resolved: 'test',
            integrity: 'test',
          },
          '@visual-framework/vf-grid': {
            version: '1.0.3',
            resolved: 'test',
            integrity: 'test',
          },
        },
      },
    },
    potentialDependents: [],
  };

  // act
  const { discoveryItem } = await getExactVersion(
    {
      discoveryItem: inputDiscoveryItem,
      profilingInformation: {},
    },
    context,
  );

  // assert
  t.deepEqual(discoveryItem, {
    name: '@visual-framework/vf-box',
    nameWithoutPrefix: 'vf-box',
    version: '2.2.0',
  });
});

test.serial('getExactVersion should throw an error when the name of the component is not specified', async (t) => {
  // assert
  const inputDiscoveryItem: PDiscoveryItem = {};
  const context: PipelineContext = {
    rootDirectory: '/test',
    vfPackagePrefix: '@visual-framework',
    cache: {
      components: {},
      lockObjects: {},
    },
    potentialDependents: [],
  };

  // act
  const error = await t.throwsAsync(
    getExactVersion(
      {
        discoveryItem: inputDiscoveryItem,
        profilingInformation: {},
      },
      context,
    ),
  );

  // assert
  t.is(error.name, 'AppError');
});
