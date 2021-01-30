import anyTest, { TestInterface } from 'ava';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';
import { PackageJson, PipelineContext } from '../../src/types';
import LoggerService from '../../src/services/logger';
import getComponents from '../../src/pipeline/steps/00-get-components';

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

  const context: PipelineContext = {
    rootDirectory: '/test',
    vfPackagePrefix: '@visual-framework',
  };
  const packageJsonFileName = path.join(context.rootDirectory, 'package.json');
  const fsReadFileStub = t.context.sinonSandbox
    .stub(fs.promises, 'readFile')
    .withArgs(packageJsonFileName, 'utf-8')
    .rejects({ code: 'ENOENT' });

  // act
  const error = await t.throwsAsync(getComponents(context));

  // assert
  t.true(error.message.includes('has not been found'));
  t.true(fsReadFileStub.calledOnce);
});

test.serial('getComponents should throw an error if no vf-core dependencies are found', async (t) => {
  // arrange
  const loggerService = LoggerService.getInstance();
  loggerService.registerLogger('debug', 'test.log', true);

  const context: PipelineContext = {
    rootDirectory: '/test',
    vfPackagePrefix: '@visual-framework',
  };
  const packageJsonFileName = path.join(context.rootDirectory, 'package.json');
  const fsReadFileStub = t.context.sinonSandbox
    .stub(fs.promises, 'readFile')
    .withArgs(packageJsonFileName, 'utf-8')
    .resolves('{}');

  // act
  const error = await t.throwsAsync(getComponents(context));

  // assert
  t.is(error.name, 'NoVfDependenciesFoundError');
  t.true(fsReadFileStub.calledOnce);
});

test.serial('getComponents should return the installed components', async (t) => {
  // arrange
  const loggerService = LoggerService.getInstance();
  loggerService.registerLogger('debug', 'test.log', true);

  const context: PipelineContext = {
    rootDirectory: '/test',
    vfPackagePrefix: '@visual-framework',
  };
  const packageJsonFileName = path.join(context.rootDirectory, 'package.json');
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
  const fsReadFileStub = t.context.sinonSandbox
    .stub(fs.promises, 'readFile')
    .withArgs(packageJsonFileName, 'utf-8')
    .resolves(JSON.stringify(packageJson));

  // act
  const components: string[] = await getComponents(context);

  // assert
  t.true(fsReadFileStub.calledOnce);
  t.deepEqual(components, [
    '@visual-framework/vf-footer',
    '@visual-framework/vf-box',
    '@visual-framework/vf-analytics-google',
  ]);
});
