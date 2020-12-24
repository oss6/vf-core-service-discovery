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
  fsExistsSyncStub: sinon.SinonStub;
  fsReadFileSyncStub: sinon.SinonStub;
  fsWriteFileSyncStub: sinon.SinonStub;
}

function setupApiService<T>(args: SystemUnderTestArguments<T>): TestObject {
  // set logger
  const loggerService = LoggerService.getInstance();
  loggerService.registerLogger('debug', 'test.log', true);

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
  const fsExistsSyncStub = sinon.stub(fs, 'existsSync').returns(args.cached);
  const fsReadFileSyncStub = sinon
    .stub(fs, 'readFileSync')
    .returns(typeof args.resource === 'string' ? args.resource : JSON.stringify(args.resource));
  const fsWriteFileSyncStub = sinon.stub(fs, 'writeFileSync').returns();

  return {
    apiService,
    fsExistsSyncStub,
    fsReadFileSyncStub,
    fsWriteFileSyncStub,
  };
}

test.afterEach(() => {
  sinon.restore();
  fetchMock.restore();
});

test.serial('getVfCoreLatestReleaseVersion should return the correct vf-core version', async (t) => {
  // arrange
  const { apiService } = setupApiService({
    fetchUrl: 'https://api.github.com/repos/visual-framework/vf-core/tags',
    resource: [
      {
        name: 'v1.0.3',
      },
      {
        name: 'v2.4.3',
      },
      {
        name: 'v2.3.1',
      },
    ],
    options: {
      forceRun: false,
      forceGitHubAuth: false,
    },
    cached: false,
  });

  // act
  const version = await apiService.getVfCoreLatestReleaseVersion();

  // assert
  t.is(version, 'v2.4.3');
  t.true(fetchMock.called());
});

test.serial('getComponentPackageJson should call the remote resource', async (t) => {
  // arrange
  const expectedPackageJson: PackageJson = {
    version: '0.1.0',
  };
  const { apiService, fsExistsSyncStub, fsReadFileSyncStub, fsWriteFileSyncStub } = setupApiService({
    fetchUrl: 'https://raw.githubusercontent.com/visual-framework/vf-core',
    resource: expectedPackageJson,
    options: {
      forceRun: false,
      forceGitHubAuth: false,
    },
    cached: false,
  });

  // act
  const packageJson = await apiService.getComponentPackageJson('vf-box');

  // assert
  t.is(fsExistsSyncStub.callCount, 1);
  t.is(fsReadFileSyncStub.callCount, 0);
  t.is(fsWriteFileSyncStub.callCount, 1);
  t.true(fetchMock.called());
  t.deepEqual(packageJson, expectedPackageJson);
});

test.serial('getComponentPackageJson should use the cache if available', async (t) => {
  // arrange
  const expectedPackageJson: PackageJson = {
    version: '0.1.0',
  };
  const { apiService, fsExistsSyncStub, fsReadFileSyncStub, fsWriteFileSyncStub } = setupApiService({
    fetchUrl: 'https://raw.githubusercontent.com/visual-framework/vf-core',
    resource: expectedPackageJson,
    options: {
      forceRun: false,
      forceGitHubAuth: false,
    },
    cached: true,
  });

  // act
  const packageJson = await apiService.getComponentPackageJson('vf-box');

  // assert
  t.is(fsExistsSyncStub.callCount, 1);
  t.is(fsReadFileSyncStub.callCount, 1);
  t.is(fsWriteFileSyncStub.callCount, 0);
  t.false(fetchMock.called());
  t.deepEqual(packageJson, expectedPackageJson);
});

test.serial('getComponentConfig should get the resource from remote', async (t) => {
  // arrange
  const expectedComponentConfig: ComponentConfig = {
    label: 'vf-box',
    status: 'live',
    title: 'Box',
  };
  const { apiService, fsExistsSyncStub, fsReadFileSyncStub, fsWriteFileSyncStub } = setupApiService({
    fetchUrl: 'https://raw.githubusercontent.com/visual-framework/vf-core',
    resource: expectedComponentConfig,
    options: {
      forceRun: false,
      forceGitHubAuth: false,
    },
    cached: false,
  });

  // act
  const componentConfig = await apiService.getComponentConfig('vf-box');

  // assert
  t.is(fsExistsSyncStub.callCount, 1);
  t.is(fsReadFileSyncStub.callCount, 0);
  t.is(fsWriteFileSyncStub.callCount, 1);
  t.true(fetchMock.called());
  t.deepEqual(componentConfig, expectedComponentConfig);
});

test.serial('getComponentConfig should use the cache if available', async (t) => {
  // arrange
  const expectedComponentConfig: ComponentConfig = {
    label: 'vf-box',
    status: 'live',
    title: 'Box',
  };
  const { apiService, fsExistsSyncStub, fsReadFileSyncStub, fsWriteFileSyncStub } = setupApiService({
    fetchUrl: 'https://raw.githubusercontent.com/visual-framework/vf-core',
    resource: expectedComponentConfig,
    options: {
      forceRun: false,
      forceGitHubAuth: false,
    },
    cached: true,
  });

  // act
  const componentConfig = await apiService.getComponentConfig('vf-box');

  // assert
  t.is(fsExistsSyncStub.callCount, 1);
  t.is(fsReadFileSyncStub.callCount, 1);
  t.is(fsWriteFileSyncStub.callCount, 0);
  t.false(fetchMock.called());
  t.deepEqual(componentConfig, expectedComponentConfig);
});

test.serial('getComponentChangelog should get the resource from remote', async (t) => {
  // arrange
  const expectedChangelog = 'test';
  const { apiService, fsExistsSyncStub, fsReadFileSyncStub, fsWriteFileSyncStub } = setupApiService({
    fetchUrl: 'https://raw.githubusercontent.com/visual-framework/vf-core',
    resource: expectedChangelog,
    options: {
      forceRun: false,
      forceGitHubAuth: false,
    },
    cached: false,
  });

  // act
  const componentChangelog = await apiService.getComponentChangelog('vf-box');

  // assert
  t.is(fsExistsSyncStub.callCount, 1);
  t.is(fsReadFileSyncStub.callCount, 0);
  t.is(fsWriteFileSyncStub.callCount, 1);
  t.true(fetchMock.called());
  t.deepEqual(componentChangelog, expectedChangelog);
});

test.serial('getComponentChangelog should use the cache if available', async (t) => {
  // arrange
  const expectedChangelog = 'test';
  const { apiService, fsExistsSyncStub, fsReadFileSyncStub, fsWriteFileSyncStub } = setupApiService({
    fetchUrl: 'https://raw.githubusercontent.com/visual-framework/vf-core',
    resource: expectedChangelog,
    options: {
      forceRun: false,
      forceGitHubAuth: false,
    },
    cached: true,
  });

  // act
  const componentChangelog = await apiService.getComponentChangelog('vf-box');

  // assert
  t.is(fsExistsSyncStub.callCount, 1);
  t.is(fsReadFileSyncStub.callCount, 1);
  t.is(fsWriteFileSyncStub.callCount, 0);
  t.false(fetchMock.called());
  t.deepEqual(componentChangelog, expectedChangelog);
});
