import anyTest, { TestInterface } from 'ava';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';
import getExactVersion, { parseLockFile } from '../../src/pipeline/steps/01-get-exact-version';
import { DiscoveryItem, LockObject, PipelineContext } from '../../src/types';
import LoggerService from '../../src/services/logger';
import { FileNotFoundError } from '../../src/errors';

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

test.serial('parseLockFile should correctly parse an npm lock file', (t) => {
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
  const rootDirectory = '/test';
  const lockFileName = path.join(rootDirectory, 'package-lock.json');
  const fsExistsSyncStub = t.context.sinonSandbox.stub(fs, 'existsSync').withArgs(lockFileName).returns(true);
  const fsReadFileSyncStub = t.context.sinonSandbox
    .stub(fs, 'readFileSync')
    .withArgs(lockFileName, 'utf-8')
    .returns(JSON.stringify(lockFile));

  // act
  const parsedLockFile = parseLockFile(rootDirectory);

  // assert
  t.deepEqual(parsedLockFile, lockFile.dependencies);
  t.true(fsExistsSyncStub.calledOnce);
  t.true(fsReadFileSyncStub.calledOnce);
});

test.serial('parseLockFile should correctly parse a yarn lock file', (t) => {
  // arrange
  const expectedLockFile: LockObject = {
    '@visual-framework/vf-box': {
      version: '2.3.0',
      resolved: 'test',
      integrity: 'test',
    },
    '@visual-framework/vf-card': {
      version: '2.3.3',
      resolved: 'test',
      integrity: 'test',
    },
  };
  const rootDirectory = '/test';
  const yarnLockFileName = path.join(rootDirectory, 'yarn.lock');
  const npmLockFileName = path.join(rootDirectory, 'package-lock.json');

  const fsExistsSyncStub = t.context.sinonSandbox.stub(fs, 'existsSync');
  fsExistsSyncStub.withArgs(yarnLockFileName).returns(true);
  fsExistsSyncStub.withArgs(npmLockFileName).returns(false);

  const fsReadFileSyncStub = t.context.sinonSandbox.stub(fs, 'readFileSync').withArgs(yarnLockFileName, 'utf-8')
    .returns(`
"@visual-framework/vf-box@^2.3.0":
  version "2.3.0"
  resolved "test"
  integrity test

"@visual-framework/vf-card@^2.3.3":
  version "2.3.3"
  resolved "test"
  integrity test
    `);

  // act
  const parsedLockFile = parseLockFile(rootDirectory);

  // assert
  t.deepEqual(parsedLockFile, expectedLockFile);
  t.true(fsExistsSyncStub.calledTwice);
  t.true(fsReadFileSyncStub.calledOnce);
});

test.serial('parseLockFile should throw an error if no lock file has been found', (t) => {
  // arrange
  const rootDirectory = '/test';
  const yarnLockFileName = path.join(rootDirectory, 'yarn.lock');
  const npmLockFileName = path.join(rootDirectory, 'package-lock.json');

  const fsExistsSyncStub = t.context.sinonSandbox.stub(fs, 'existsSync');
  fsExistsSyncStub.withArgs(yarnLockFileName).returns(false);
  fsExistsSyncStub.withArgs(npmLockFileName).returns(false);
  fsExistsSyncStub.callThrough();

  // act
  const error = t.throws(
    () => {
      parseLockFile(rootDirectory);
    },
    { instanceOf: FileNotFoundError },
  );

  // assert
  const fsExistsSyncCalls = fsExistsSyncStub
    .getCalls()
    .filter((c) => c.firstArg === yarnLockFileName || c.firstArg === npmLockFileName);
  t.is(fsExistsSyncCalls.length, 2);
  t.is(error.name, 'FileNotFoundError');
});

test.serial('getExactVersion should return the exact version of the input component', async (t) => {
  // arrange
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
  const fsExistsSyncStub = t.context.sinonSandbox.stub(fs, 'existsSync').withArgs(lockFileName).returns(true);
  const fsReadFileSyncStub = t.context.sinonSandbox
    .stub(fs, 'readFileSync')
    .withArgs(lockFileName, 'utf-8')
    .returns(JSON.stringify(lockFile));
  const inputDiscoveryItem: Partial<DiscoveryItem> = {
    name: '@visual-framework/vf-box',
    nameWithoutPrefix: 'vf-box',
  };
  const context: PipelineContext = {
    rootDirectory: '/test',
    vfPackagePrefix: '@visual-framework',
  };

  // TODO: check if it doesn't interfere (use mock-fs in the future)
  t.context.sinonSandbox.stub(process, 'cwd').returns(rootDirectory);

  // act
  const discoveryItem: Partial<DiscoveryItem> = await getExactVersion(inputDiscoveryItem, context);

  // assert
  t.deepEqual(discoveryItem, {
    name: '@visual-framework/vf-box',
    nameWithoutPrefix: 'vf-box',
    version: '2.2.0',
  });
  t.true(fsExistsSyncStub.calledOnce);
  t.true(fsReadFileSyncStub.calledOnce);
});
