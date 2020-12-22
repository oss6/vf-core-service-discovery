import test from 'ava';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import fetchMock from 'fetch-mock';
import fs from 'fs';
import ApiService from '../src/services/api';
import OptionsService from '../src/services/options';
import { Options, PackageJson } from '../src/types';
import LoggerService from '../src/services/logger';

interface SystemUnderTestArguments<T> {
  component: string;
  resource?: T;
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
  loggerService.registerLogger('debug', true);

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
  fetchMock.mock('begin:https://raw.githubusercontent.com/visual-framework/vf-core/develop/components', {
    body: args.resource,
    status: 200,
  });

  // mock file system
  const fsExistsSyncStub = sinon.stub(fs, 'existsSync').returns(args.cached);
  const fsReadFileSyncStub = sinon.stub(fs, 'readFileSync').returns(JSON.stringify(args.resource));
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

test.serial('getComponentPackageJson should call the remote resource', async (t) => {
  // arrange
  const expectedPackageJson: PackageJson = {
    version: '0.1.0',
  };
  const { apiService, fsExistsSyncStub, fsReadFileSyncStub, fsWriteFileSyncStub } = setupApiService({
    component: 'vf-box',
    resource: expectedPackageJson,
    options: {
      forceRun: false,
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
    component: 'vf-box',
    resource: expectedPackageJson,
    options: {
      forceRun: false,
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
