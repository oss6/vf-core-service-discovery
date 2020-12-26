import anyTest, { TestInterface } from 'ava';
import _proxyquire from 'proxyquire';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';
import { PackageJson, ProcessingContext } from '../../src/types';
import LoggerService from '../../src/services/logger';

const proxyquire = _proxyquire.noPreserveCache().noCallThru();

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

test.serial('getComponents should throw an error if package.json is not found', async (t) => {
  // arrange
  const loggerService = LoggerService.getInstance();
  loggerService.registerLogger('debug', 'test.log', true);

  const context: ProcessingContext = {
    rootDirectory: '/test',
    vfPackagePrefix: '@visual-framework',
  };
  const packageJsonFileName = path.join(context.rootDirectory, 'package.json');
  const getContextStub = t.context.sinonSandbox.stub().returns(context);
  const getComponents = proxyquire('../../src/pipeline/steps/00-get-components', {
    '../../context': getContextStub,
  }).default;
  const fsExistsSyncStub = t.context.sinonSandbox.stub(fs, 'existsSync').withArgs(packageJsonFileName).returns(false);

  // act
  const error = await t.throwsAsync(getComponents);

  // assert
  t.true(error.message.includes('has not been found'));
  t.true(fsExistsSyncStub.calledOnce);
});

test.serial('getComponents should throw an error if no vf-core dependencies are found', async (t) => {
  // arrange
  const loggerService = LoggerService.getInstance();
  loggerService.registerLogger('debug', 'test.log', true);

  const context: ProcessingContext = {
    rootDirectory: '/test',
    vfPackagePrefix: '@visual-framework',
  };
  const packageJsonFileName = path.join(context.rootDirectory, 'package.json');
  const getContextStub = t.context.sinonSandbox.stub().returns(context);
  const getComponents = proxyquire('../../src/pipeline/steps/00-get-components', {
    '../../context': getContextStub,
  }).default;
  const fsExistsSyncStub = t.context.sinonSandbox.stub(fs, 'existsSync').withArgs(packageJsonFileName).returns(true);
  const fsReadFileSyncStub = t.context.sinonSandbox
    .stub(fs, 'readFileSync')
    .withArgs(packageJsonFileName, 'utf-8')
    .returns('{}');

  // act
  const error = await t.throwsAsync(getComponents);

  // assert
  t.is(error.name, 'NoVfDependenciesFoundError');
  t.true(fsExistsSyncStub.calledOnce);
  t.true(fsReadFileSyncStub.calledOnce);
});

test.serial('getComponents should return the installed components', async (t) => {
  // arrange
  const loggerService = LoggerService.getInstance();
  loggerService.registerLogger('debug', 'test.log', true);

  const context: ProcessingContext = {
    rootDirectory: '/test',
    vfPackagePrefix: '@visual-framework',
  };
  const packageJsonFileName = path.join(context.rootDirectory, 'package.json');

  const getContextStub = t.context.sinonSandbox.stub().returns(context);
  const getComponents = proxyquire('../../src/pipeline/steps/00-get-components', {
    '../../context': getContextStub,
  }).default;

  const fsExistsSyncStub = t.context.sinonSandbox.stub(fs, 'existsSync').withArgs(packageJsonFileName).returns(true);

  const packageJson: PackageJson = {
    version: '2.4.3',
    dependencies: {
      test: '^4.2.1',
      '@visual-framework/vf-footer': '3.2.1',
      '@visual-framework/vf-box': '3.1.2',
    },
    devDependencies: {
      '@visual-framework/vf-analytics-google': '3.6.4',
    },
  };
  const fsReadFileSyncStub = t.context.sinonSandbox
    .stub(fs, 'readFileSync')
    .withArgs(packageJsonFileName, 'utf-8')
    .returns(JSON.stringify(packageJson));

  // act
  const components: string[] = await getComponents();

  // assert
  t.true(fsExistsSyncStub.calledOnce);
  t.true(fsReadFileSyncStub.calledOnce);
  t.deepEqual(components, [
    '@visual-framework/vf-footer',
    '@visual-framework/vf-box',
    '@visual-framework/vf-analytics-google',
  ]);
});
