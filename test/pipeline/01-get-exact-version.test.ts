import anyTest, { TestInterface } from 'ava';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';
import getExactVersion, { parseLockFile } from '../../src/pipeline/steps/01-get-exact-version';
import { LockObject, PDiscoveryItem, PipelineContext } from '../../src/types';
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
  const rootDirectory = '/test';
  const lockFileName = path.join(rootDirectory, 'package-lock.json');
  const fsReadFileStub = t.context.sinonSandbox
    .stub(fs.promises, 'readFile')
    .withArgs(lockFileName, 'utf-8')
    .resolves(JSON.stringify(lockFile));

  // act
  const parsedLockFile = await parseLockFile(rootDirectory);

  // assert
  t.deepEqual(parsedLockFile, lockFile.dependencies);
  t.true(fsReadFileStub.calledOnce);
});

test.serial('parseLockFile should correctly parse a yarn lock file', async (t) => {
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
  const fsReadFileStub = t.context.sinonSandbox.stub(fs.promises, 'readFile');

  fsReadFileStub.onCall(0).rejects({ code: 'ENOENT' });
  fsReadFileStub.onCall(1).resolves(`
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
  const parsedLockFile = await parseLockFile(rootDirectory);

  // assert
  t.deepEqual(parsedLockFile, expectedLockFile);
  t.true(fsReadFileStub.calledTwice);
});

test.serial('parseLockFile should throw an error if no lock file has been found', async (t) => {
  // arrange
  const rootDirectory = '/test';
  const fsReadFileStub = t.context.sinonSandbox.stub(fs.promises, 'readFile');

  fsReadFileStub.onCall(0).rejects({ code: 'ENOENT' });
  fsReadFileStub.onCall(1).rejects({ code: 'ENOENT' });

  // act
  const error = await t.throwsAsync(parseLockFile(rootDirectory));

  // assert
  t.true(fsReadFileStub.calledTwice);
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
  const fsReadFileStub = t.context.sinonSandbox
    .stub(fs.promises, 'readFile')
    .withArgs(lockFileName, 'utf-8')
    .resolves(JSON.stringify(lockFile));
  const inputDiscoveryItem: PDiscoveryItem = {
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
  const discoveryItem: PDiscoveryItem = await getExactVersion(inputDiscoveryItem, context);

  // assert
  t.deepEqual(discoveryItem, {
    name: '@visual-framework/vf-box',
    nameWithoutPrefix: 'vf-box',
    version: '2.2.0',
  });
  t.true(fsReadFileStub.calledOnce);
});
