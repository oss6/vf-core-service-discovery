import anyTest, { ExecutionContext, TestInterface } from 'ava';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import fs from 'fs';
import ConfigurationService from '../src/services/configuration';
import LoggerService from '../src/services/logger';
import OptionsService from '../src/services/options';
import { AppConfig, Options } from '../src/types';
import { getAppConfigFileName, getAppDirectory, getCachedComponentsDirectory } from '../src/helpers';
import { shouldInvalidateFixture } from './fixture/configuration.fixture';
import { FileNotFoundError } from '../src/errors';

interface Context {
  sinonSandbox: sinon.SinonSandbox;
}

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

const test = anyTest as TestInterface<Context>;

function setupConfigurationService(t: ExecutionContext<Context>, args: SystemUnderTestArguments): TestObject {
  // set logger
  const loggerService = LoggerService.getInstance();
  loggerService.registerLogger('debug', 'test.log', true);

  // set options
  const optionsService = OptionsService.getInstance();
  optionsService.setOptions(args.options);

  // set configuration service
  const rimrafStub = t.context.sinonSandbox.stub();
  const ConfigurationServiceType = proxyquire('../src/services/configuration', {
    rimraf: rimrafStub,
  }).default;

  const configurationService: ConfigurationService = ConfigurationServiceType.getInstance();

  // set file system
  const fsExistsSyncStub = t.context.sinonSandbox.stub(fs, 'existsSync');

  fsExistsSyncStub.withArgs(getAppDirectory()).returns(args.appDirectoryExists);
  fsExistsSyncStub.withArgs(getAppConfigFileName()).returns(args.appConfigFileNameExists);
  fsExistsSyncStub.withArgs(getCachedComponentsDirectory()).returns(args.cachedComponentsDirectoryExists);

  const fsReadFileSyncStub = t.context.sinonSandbox
    .stub(fs, 'readFileSync')
    .returns(
      '{"cacheExpiry":"8h","lastInvalidation":"2020-12-24T15:45:08Z","gitHubAccessToken":"test","vfCoreVersion":"v2.4.3"}',
    );
  const fsWriteFileSyncStub = t.context.sinonSandbox.stub(fs, 'writeFileSync').returns();
  const fsMkdirSyncStub = t.context.sinonSandbox.stub(fs, 'mkdirSync');

  return {
    configurationService,
    fsExistsSyncStub,
    fsReadFileSyncStub,
    fsWriteFileSyncStub,
    fsMkdirSyncStub,
  };
}

test.serial.before((t) => {
  t.context.sinonSandbox = sinon.createSandbox();
});

test.serial.afterEach((t) => {
  t.context.sinonSandbox.restore();
  sinon.restore();
});

test.serial('load should throw FileNotFoundError if the app configuration is not present', (t) => {
  // arrange
  const appConfigFileName = getAppConfigFileName();
  const fsExistsSyncStub = t.context.sinonSandbox.stub(fs, 'existsSync').withArgs(appConfigFileName).returns(false);
  const fsReadFileSyncStub = t.context.sinonSandbox.stub(fs, 'readFileSync');
  const configurationService = ConfigurationService.getInstance();

  // act
  const error = t.throws(
    () => {
      configurationService.load();
    },
    { instanceOf: FileNotFoundError },
  );

  // assert
  t.true(fsExistsSyncStub.calledOnce);
  t.true(fsReadFileSyncStub.notCalled);
  t.true(error.message.includes('has not been found'));
});

test.serial('load should successfully load the configuration if present', (t) => {
  // arrange
  const appConfigFileName = getAppConfigFileName();
  const fsExistsSyncStub = t.context.sinonSandbox.stub(fs, 'existsSync').withArgs(appConfigFileName).returns(true);
  const fsReadFileSyncStub = t.context.sinonSandbox
    .stub(fs, 'readFileSync')
    .returns('{"vfCoreVersion": "v3.0.1", "lastInvalidation": null, "cacheExpiry": "8h"}');
  const configurationService = ConfigurationService.getInstance();

  // act
  configurationService.load();

  // assert
  t.true(fsExistsSyncStub.calledOnce);
  t.true(fsReadFileSyncStub.calledOnce);
  t.deepEqual(configurationService.config, { vfCoreVersion: 'v3.0.1', lastInvalidation: null, cacheExpiry: '8h' });
});

test.serial('reset should throw FileNotFoundError if the app configuration is not present', (t) => {
  // arrange
  const appConfigFileName = getAppConfigFileName();
  const fsExistsSyncStub = t.context.sinonSandbox.stub(fs, 'existsSync').withArgs(appConfigFileName).returns(false);
  const configurationService = ConfigurationService.getInstance();

  // act
  const error = t.throws(
    () => {
      configurationService.reset();
    },
    { instanceOf: FileNotFoundError },
  );

  // assert
  t.true(fsExistsSyncStub.calledOnce);
  t.true(error.message.includes('has not been found'));
});

test.serial('reset should successfully reset the configuration if present', (t) => {
  // arrange
  const appConfigFileName = getAppConfigFileName();
  const fsExistsSyncStub = t.context.sinonSandbox.stub(fs, 'existsSync').withArgs(appConfigFileName).returns(true);
  const fsWriteFileSyncStub = t.context.sinonSandbox.stub(fs, 'writeFileSync');
  const configurationService = ConfigurationService.getInstance();

  // act
  configurationService.reset();

  // assert
  t.true(fsExistsSyncStub.calledOnce);
  t.true(fsWriteFileSyncStub.calledOnce);
  t.deepEqual(configurationService.config, ConfigurationService.defaultAppConfig);
});

test.serial('setup should initialise the configuration if the directory is not existent', async (t) => {
  // arrange
  const {
    configurationService,
    fsExistsSyncStub,
    fsMkdirSyncStub,
    fsReadFileSyncStub,
    fsWriteFileSyncStub,
  } = setupConfigurationService(t, {
    options: {
      forceGitHubAuth: false,
      forceRun: false,
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
  } = setupConfigurationService(t, {
    options: {
      forceGitHubAuth: false,
      forceRun: false,
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
