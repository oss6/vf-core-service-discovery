import test, { ExecutionContext } from 'ava';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import fs from 'fs';
import ConfigurationService from '../src/services/configuration';
import LoggerService from '../src/services/logger';
import OptionsService from '../src/services/options';
import { AppConfig, Options } from '../src/types';
import { getAppConfigFileName, getAppDirectory, getCachedComponentsDirectory } from '../src/helpers';
import { shouldInvalidateFixture } from './fixture/configuration.fixture';

interface SystemUnderTestArguments {
  options: Options;
  appDirectoryExists: boolean;
  appConfigFileNameExists: boolean;
  cachedComponentsDirectoryExists: boolean;
}

interface TestObject {
  configurationService: ConfigurationService;
  fsExistsSyncStub: sinon.SinonStub;
  fsReadFileSyncStub: sinon.SinonStub;
  fsWriteFileSyncStub: sinon.SinonStub;
  fsMkdirSyncStub: sinon.SinonStub;
}

function setupConfigurationService(args: SystemUnderTestArguments): TestObject {
  // set logger
  const loggerService = LoggerService.getInstance();
  loggerService.registerLogger('debug', 'test.log', true);

  // set options
  const optionsService = OptionsService.getInstance();
  optionsService.setOptions(args.options);

  // set configuration service
  const rimrafStub = sinon.stub();
  const ConfigurationServiceType = proxyquire('../src/services/configuration', {
    rimraf: rimrafStub,
  }).default;

  const configurationService: ConfigurationService = ConfigurationServiceType.getInstance();

  // set file system
  const fsExistsSyncStub = sinon.stub(fs, 'existsSync');

  fsExistsSyncStub.withArgs(getAppDirectory()).returns(args.appDirectoryExists);
  fsExistsSyncStub.withArgs(getAppConfigFileName()).returns(args.appConfigFileNameExists);
  fsExistsSyncStub.withArgs(getCachedComponentsDirectory()).returns(args.cachedComponentsDirectoryExists);

  const fsReadFileSyncStub = sinon
    .stub(fs, 'readFileSync')
    .returns(
      '{"cacheExpiry":"8h","lastInvalidation":"2020-12-24T15:45:08Z","gitHubAccessToken":"test","vfCoreVersion":"v2.4.3"}',
    );
  const fsWriteFileSyncStub = sinon.stub(fs, 'writeFileSync').returns();
  const fsMkdirSyncStub = sinon.stub(fs, 'mkdirSync');

  return {
    configurationService,
    fsExistsSyncStub,
    fsReadFileSyncStub,
    fsWriteFileSyncStub,
    fsMkdirSyncStub,
  };
}

test.afterEach(() => {
  sinon.restore();
});

test.serial('setup should initialise the configuration if the directory is not existent', async (t) => {
  // arrange
  const {
    configurationService,
    fsExistsSyncStub,
    fsMkdirSyncStub,
    fsReadFileSyncStub,
    fsWriteFileSyncStub,
  } = setupConfigurationService({
    options: {
      forceGitHubAuth: false,
      forceRun: false,
      logFile: 'test.log',
    },
    appDirectoryExists: false,
    appConfigFileNameExists: false,
    cachedComponentsDirectoryExists: false,
  });

  const appDirectory = getAppDirectory();
  const appConfigFileName = getAppConfigFileName();
  const cachedComponentsDirectory = getCachedComponentsDirectory();

  // act
  await configurationService.setup();

  // assert
  t.true(fsExistsSyncStub.calledWith(appDirectory), '');
  t.true(fsExistsSyncStub.calledWith(appConfigFileName));
  t.true(fsExistsSyncStub.calledWith(cachedComponentsDirectory));
  t.true(fsMkdirSyncStub.calledWith(appDirectory));
  t.true(fsMkdirSyncStub.calledWith(cachedComponentsDirectory));
  t.true(fsWriteFileSyncStub.calledWith(appConfigFileName));
  t.true(fsReadFileSyncStub.notCalled);
});

test.serial('setup should use the existing configuration', async (t) => {
  // arrange
  const {
    configurationService,
    fsExistsSyncStub,
    fsMkdirSyncStub,
    fsReadFileSyncStub,
    fsWriteFileSyncStub,
  } = setupConfigurationService({
    options: {
      forceGitHubAuth: false,
      forceRun: false,
      logFile: 'test.log',
    },
    appDirectoryExists: true,
    appConfigFileNameExists: true,
    cachedComponentsDirectoryExists: true,
  });

  const appDirectory = getAppDirectory();
  const appConfigFileName = getAppConfigFileName();
  const cachedComponentsDirectory = getCachedComponentsDirectory();

  // act
  await configurationService.setup();

  // assert
  t.true(fsExistsSyncStub.calledWith(appDirectory));
  t.true(fsExistsSyncStub.calledWith(appConfigFileName));
  t.true(fsExistsSyncStub.calledWith(cachedComponentsDirectory));
  t.true(fsMkdirSyncStub.notCalled);
  t.true(fsWriteFileSyncStub.notCalled);
  t.true(fsReadFileSyncStub.calledWith(appConfigFileName, 'utf-8'));
  t.deepEqual(configurationService.config, {
    cacheExpiry: '8h',
    lastInvalidation: new Date('2020-12-24T15:45:08Z'),
    gitHubAccessToken: 'test',
    vfCoreVersion: 'v2.4.3',
  });
});

function shouldInvalidateMacro(t: ExecutionContext, input: AppConfig, expected: boolean) {
  // arrange
  const configurationService = ConfigurationService.getInstance();
  configurationService.update('cacheExpiry', input.cacheExpiry, false);
  configurationService.update('gitHubAccessToken', input.gitHubAccessToken, false);
  configurationService.update('lastInvalidation', input.lastInvalidation, false);
  configurationService.update('vfCoreVersion', input.vfCoreVersion, false);

  // act
  const shouldInvalidate = configurationService.shouldInvalidate();

  // assert
  t.is(shouldInvalidate, expected);
}

shouldInvalidateFixture.forEach(({ input, expected }) => {
  test.serial(
    `shouldInvalidate with ${JSON.stringify(input)} should return ${expected}`,
    shouldInvalidateMacro,
    input,
    expected,
  );
});
