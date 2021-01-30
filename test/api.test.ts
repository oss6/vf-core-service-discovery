import test from 'ava';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import fetchMock from 'fetch-mock';
import fs from 'fs';
import ApiService from '../src/services/api';
import OptionsService from '../src/services/options';
import { ComponentConfig, Options, PackageJson } from '../src/types';
import LoggerService from '../src/services/logger';
import ConfigurationService from '../src/services/configuration';

interface SystemUnderTestArguments<T> {
  resource?: T;
  fetchUrl: string;
  options: Options;
  cached: boolean;
}

interface TestObject {
  apiService: ApiService;
  fsReadFileStub: sinon.SinonStub;
  fsWriteFileStub: sinon.SinonStub;
}

function setupApiService<T>(args: SystemUnderTestArguments<T>): TestObject {
  // set configuration
  const configurationService = ConfigurationService.getInstance();
  configurationService.update('vfCoreVersion', '2.4.3', false);

  // set options
  const optionsService = OptionsService.getInstance();
  optionsService.setOptions(args.options);

  // set API service
  const mkdirpStub = sinon.stub();
  const ApiServiceType = proxyquire('../src/services/api', {
    mkdirp: mkdirpStub,
  }).default;

  const apiService = ApiServiceType.getInstance();

  // mock http request
  fetchMock.mock(`begin:${args.fetchUrl}`, {
    body: args.resource,
    status: 200,
  });

  // mock file system
  const resource = typeof args.resource === 'string' ? args.resource : JSON.stringify(args.resource);
  const fsReadFileStub = sinon.stub(fs.promises, 'readFile');
  // .resolves(args.cached ? null : { code: 'ENOENT' }, resource);
  const fsWriteFileStub = sinon.stub(fs.promises, 'writeFile');

  if (args.cached) {
    fsReadFileStub.resolves(resource);
  } else {
    fsReadFileStub.rejects({ code: 'ENOENT' });
  }

  return {
    apiService,
    fsReadFileStub,
    fsWriteFileStub,
  };
}

test.serial.before(() => {
  const loggerService = LoggerService.getInstance();
  loggerService.registerLogger('debug', 'test.log', true);
});

test.serial.afterEach(() => {
  sinon.restore();
  fetchMock.restore();
});

test.serial('getVfCoreLatestReleaseVersion should return the correct vf-core version', async (t) => {
  // arrange
  const { apiService } = setupApiService({
    fetchUrl: 'https://api.github.com/repos/visual-framework/vf-core/releases/latest',
    resource: {
      tag_name: 'v2.4.5',
    },
    options: {
      forceRun: false,
      logFile: '',
      loggingEnabled: false,
      verbose: false,
    },
    cached: false,
  });

  // act
  const version = await apiService.getVfCoreLatestReleaseVersion();

  // assert
  t.is(version, 'v2.4.5');
  t.true(fetchMock.called());
});

test.serial('getVfCoreLatestReleaseVersion should fallback to develop if the call is unsuccessful', async (t) => {
  // arrange
  const mkdirpStub = sinon.stub();
  const ApiServiceType = proxyquire('../src/services/api', {
    mkdirp: mkdirpStub,
  }).default;
  const apiService: ApiService = ApiServiceType.getInstance();
  const url = 'https://api.github.com/repos/visual-framework/vf-core/releases/latest';

  fetchMock.mock(url, 500);

  // act
  const version = await apiService.getVfCoreLatestReleaseVersion();

  // assert
  t.is(version, 'develop');
  t.true(fetchMock.called());
});

test.serial('getComponentPackageJson should call the remote resource', async (t) => {
  // arrange
  const expectedPackageJson: PackageJson = {
    version: '0.1.0',
  };
  const { apiService, fsReadFileStub, fsWriteFileStub } = setupApiService({
    fetchUrl: 'https://raw.githubusercontent.com/visual-framework/vf-core',
    resource: expectedPackageJson,
    options: {
      forceRun: false,
      logFile: '',
      loggingEnabled: false,
      verbose: false,
    },
    cached: false,
  });

  // act
  const packageJson = await apiService.getComponentPackageJson('vf-box');

  // assert
  t.is(fsReadFileStub.callCount, 1);
  t.is(fsWriteFileStub.callCount, 1);
  t.true(fetchMock.called());
  t.deepEqual(packageJson, expectedPackageJson);
});

test.serial('getComponentPackageJson should use the cache if available', async (t) => {
  // arrange
  const expectedPackageJson: PackageJson = {
    version: '0.1.0',
  };
  const { apiService, fsReadFileStub, fsWriteFileStub } = setupApiService({
    fetchUrl: 'https://raw.githubusercontent.com/visual-framework/vf-core',
    resource: expectedPackageJson,
    options: {
      forceRun: false,
      logFile: '',
      loggingEnabled: false,
      verbose: false,
    },
    cached: true,
  });

  // act
  const packageJson = await apiService.getComponentPackageJson('vf-box');

  // assert
  t.is(fsReadFileStub.callCount, 1);
  t.is(fsWriteFileStub.callCount, 0);
  t.false(fetchMock.called());
  t.deepEqual(packageJson, expectedPackageJson);
});

test.serial('getYamlComponentConfig should throw an error if vfCoreLatestReleaseVersion is not set', async (t) => {
  // arrange
  const configurationService = ConfigurationService.getInstance();
  configurationService.update('vfCoreVersion', '', false);

  const mkdirpStub = sinon.stub();
  const ApiServiceType = proxyquire('../src/services/api', {
    mkdirp: mkdirpStub,
  }).default;
  const apiService: ApiService = ApiServiceType.getInstance();

  // act
  const error = await t.throwsAsync(apiService.getYamlComponentConfig('vf-box'));

  // assert
  t.is(error.name, 'MissingConfigurationError');
});

test.serial('getJsComponentConfig should throw an error if vfCoreLatestReleaseVersion is not set', async (t) => {
  // arrange
  const configurationService = ConfigurationService.getInstance();
  configurationService.update('vfCoreVersion', '', false);

  const mkdirpStub = sinon.stub();
  const ApiServiceType = proxyquire('../src/services/api', {
    mkdirp: mkdirpStub,
  }).default;
  const apiService: ApiService = ApiServiceType.getInstance();

  // act
  const error = await t.throwsAsync(apiService.getJsComponentConfig('vf-box'));

  // assert
  t.is(error.name, 'MissingConfigurationError');
});

test.serial('getYamlComponentConfig should get the resource from remote', async (t) => {
  // arrange
  const expectedComponentConfig: ComponentConfig = {
    label: 'vf-box',
    status: 'live',
    title: 'Box',
  };
  const { apiService, fsReadFileStub, fsWriteFileStub } = setupApiService({
    fetchUrl: 'https://raw.githubusercontent.com/visual-framework/vf-core',
    resource: expectedComponentConfig,
    options: {
      forceRun: false,
      logFile: '',
      loggingEnabled: false,
      verbose: false,
    },
    cached: false,
  });

  // act
  const componentConfig = await apiService.getYamlComponentConfig('vf-box');

  // assert
  t.is(fsReadFileStub.callCount, 1);
  t.is(fsWriteFileStub.callCount, 1);
  t.true(fetchMock.called());
  t.deepEqual(componentConfig, expectedComponentConfig);
});

test.serial('getYamlComponentConfig should use the cache if available', async (t) => {
  // arrange
  const expectedComponentConfig: ComponentConfig = {
    label: 'vf-box',
    status: 'live',
    title: 'Box',
  };
  const { apiService, fsReadFileStub, fsWriteFileStub } = setupApiService({
    fetchUrl: 'https://raw.githubusercontent.com/visual-framework/vf-core',
    resource: expectedComponentConfig,
    options: {
      forceRun: false,
      logFile: '',
      loggingEnabled: false,
      verbose: false,
    },
    cached: true,
  });

  // act
  const componentConfig = await apiService.getYamlComponentConfig('vf-box');

  // assert
  t.is(fsReadFileStub.callCount, 1);
  t.is(fsWriteFileStub.callCount, 0);
  t.false(fetchMock.called());
  t.deepEqual(componentConfig, expectedComponentConfig);
});

test.serial('getComponentChangelog should get the resource from remote', async (t) => {
  // arrange
  const expectedChangelog = 'test';
  const { apiService, fsReadFileStub, fsWriteFileStub } = setupApiService({
    fetchUrl: 'https://raw.githubusercontent.com/visual-framework/vf-core',
    resource: expectedChangelog,
    options: {
      forceRun: false,
      logFile: '',
      loggingEnabled: false,
      verbose: false,
    },
    cached: false,
  });

  // act
  const componentChangelog = await apiService.getComponentChangelog('vf-box');

  // assert
  t.is(fsReadFileStub.callCount, 1);
  t.is(fsWriteFileStub.callCount, 1);
  t.true(fetchMock.called());
  t.deepEqual(componentChangelog, expectedChangelog);
});

test.serial('getComponentChangelog should use the cache if available', async (t) => {
  // arrange
  const expectedChangelog = 'test';
  const { apiService, fsReadFileStub, fsWriteFileStub } = setupApiService({
    fetchUrl: 'https://raw.githubusercontent.com/visual-framework/vf-core',
    resource: expectedChangelog,
    options: {
      forceRun: false,
      logFile: '',
      loggingEnabled: false,
      verbose: false,
    },
    cached: true,
  });

  // act
  const componentChangelog = await apiService.getComponentChangelog('vf-box');

  // assert
  t.is(fsReadFileStub.callCount, 1);
  t.is(fsWriteFileStub.callCount, 0);
  t.false(fetchMock.called());
  t.deepEqual(componentChangelog, expectedChangelog);
});

test.serial('getComponentChangelog should throw an error if vfCoreLatestReleaseVersion is not set', async (t) => {
  // arrange
  const configurationService = ConfigurationService.getInstance();
  configurationService.update('vfCoreVersion', '', false);

  const mkdirpStub = sinon.stub();
  const ApiServiceType = proxyquire('../src/services/api', {
    mkdirp: mkdirpStub,
  }).default;
  const apiService: ApiService = ApiServiceType.getInstance();

  // act
  const error = await t.throwsAsync(apiService.getComponentChangelog('vf-box'));

  // assert
  t.is(error.name, 'MissingConfigurationError');
});
