import test from 'ava';
import sinon from 'sinon';
import fetchMock from 'fetch-mock';
import ApiService from '../src/services/api';
import OptionsService from '../src/services/options';
import { PackageJson, PipelineContext } from '../src/types';
import LoggerService from '../src/services/logger';
import ConfigurationService from '../src/services/configuration';

test.serial.before(() => {
  const loggerService = LoggerService.getInstance();
  loggerService.registerLogger('debug', 'test.log', true);
});

test.serial.afterEach(() => {
  sinon.restore();
  fetchMock.restore();
});

test.serial('getComponentPackageJson should call the remote resource', async (t) => {
  // arrange
  const configurationService = ConfigurationService.getInstance();
  configurationService.update('vfCoreVersion', '2.8.3', false);

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

  const expectedPackageJson: PackageJson = {
    version: '0.1.0',
  };

  const componentName = 'vf-box';

  const context: PipelineContext = {
    cache: {
      lockObjects: {},
      components: {},
    },
    rootDirectory: '/test',
    vfPackagePrefix: '@visual-framework',
    potentialDependents: [],
  };

  const fetchUrl = 'https://raw.githubusercontent.com/visual-framework/vf-core';

  const apiService = ApiService.getInstance();

  fetchMock.mock(`begin:${fetchUrl}`, {
    body: JSON.stringify(expectedPackageJson),
    status: 200,
  });

  // act
  const packageJson = await apiService.getComponentPackageJson(componentName, context);

  // assert
  t.true(fetchMock.called());
  t.deepEqual(packageJson, expectedPackageJson);
  t.deepEqual(context.cache.components[componentName].packageJson, packageJson);
});

test.serial('getComponentPackageJson should use the cache if available', async (t) => {
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

  const expectedPackageJson: PackageJson = {
    version: '0.1.0',
  };

  const componentName = 'vf-box';

  const context: PipelineContext = {
    cache: {
      lockObjects: {},
      components: {
        [componentName]: {
          packageJson: expectedPackageJson,
          changelog: '',
          config: {
            label: 'test',
            status: 'test',
            title: 'test',
          },
        },
      },
    },
    rootDirectory: '/test',
    vfPackagePrefix: '@visual-framework',
    potentialDependents: [],
  };

  const fetchUrl = 'https://raw.githubusercontent.com/visual-framework/vf-core';

  const apiService = ApiService.getInstance();

  fetchMock.mock(`begin:${fetchUrl}`, {
    body: JSON.stringify(expectedPackageJson),
    status: 200,
  });

  // act
  const packageJson = await apiService.getComponentPackageJson(componentName, context);

  // assert
  t.false(fetchMock.called());
  t.deepEqual(packageJson, expectedPackageJson);
});

test.serial('getYamlComponentConfig should throw an error if vfCoreLatestReleaseVersion is not set', async (t) => {
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

  const configurationService = ConfigurationService.getInstance();
  configurationService.update('vfCoreVersion', '', false);

  const componentName = 'vf-box';

  const context: PipelineContext = {
    cache: {
      lockObjects: {},
      components: {},
    },
    rootDirectory: '/test',
    vfPackagePrefix: '@visual-framework',
    potentialDependents: [],
  };

  const fetchUrl = 'https://raw.githubusercontent.com/visual-framework/vf-core';

  const apiService = ApiService.getInstance();

  fetchMock.mock(`begin:${fetchUrl}`, {
    body: JSON.stringify('{}'),
    status: 200,
  });

  // act
  const error = await t.throwsAsync(apiService.getYamlComponentConfig(componentName, context));

  // assert
  t.false(fetchMock.called());
  t.is(error.name, 'MissingConfigurationError');
});

test.serial('getJsComponentConfig should throw an error if vfCoreLatestReleaseVersion is not set', async (t) => {
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

  const configurationService = ConfigurationService.getInstance();
  configurationService.update('vfCoreVersion', '', false);

  const componentName = 'vf-box';

  const context: PipelineContext = {
    cache: {
      lockObjects: {},
      components: {},
    },
    rootDirectory: '/test',
    vfPackagePrefix: '@visual-framework',
    potentialDependents: [],
  };

  const fetchUrl = 'https://raw.githubusercontent.com/visual-framework/vf-core';

  const apiService = ApiService.getInstance();

  fetchMock.mock(`begin:${fetchUrl}`, {
    body: JSON.stringify('{}'),
    status: 200,
  });

  // act
  const error = await t.throwsAsync(apiService.getJsComponentConfig(componentName, context));

  // assert
  t.false(fetchMock.called());
  t.is(error.name, 'MissingConfigurationError');
});
