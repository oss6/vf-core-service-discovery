import test from 'ava';
import sinon from 'sinon';
import ApiService from '../../src/services/api';
import getConfig from '../../src/pipeline/steps/03-get-config';
import LoggerService from '../../src/services/logger';
import OptionsService from '../../src/services/options';
import { PDiscoveryItem, PipelineContext } from '../../src/types';

test.serial.afterEach(() => {
  sinon.restore();
});

test.serial('getConfig should extend a discovery item with their YAML configuration', async (t) => {
  // arrange
  const loggerService = LoggerService.getInstance();
  loggerService.registerLogger('debug', 'test.log', true);

  const optionsService = OptionsService.getInstance();
  optionsService.setOptions({
    forceRun: false,
    logFile: '',
    loggingEnabled: false,
    profile: false,
    verbose: false,
    disabled: [],
    onlyOutdated: false,
  });

  const context: PipelineContext = {
    cache: {
      components: {},
      lockObjects: {},
    },
    rootDirectory: '',
    vfPackagePrefix: '',
  };

  const apiService = ApiService.getInstance();
  const getYamlComponentConfigStub = sinon.stub(apiService, 'getYamlComponentConfig');
  getYamlComponentConfigStub.withArgs('vf-box', context).resolves({
    label: 'Box',
    status: 'live',
    title: 'vf-box',
  });
  const getJsComponentConfigStub = sinon.stub(apiService, 'getJsComponentConfig');
  getJsComponentConfigStub.withArgs('vf-box', context).resolves(null);

  // act
  const { discoveryItem } = await getConfig(
    {
      discoveryItem: {
        name: '@visual-framework/vf-box',
        nameWithoutPrefix: 'vf-box',
        version: '1.4.0',
        packageJson: { version: '1.4.0' },
      },
      profilingInformation: {},
    },
    context,
  );

  // assert
  t.deepEqual(discoveryItem, {
    name: '@visual-framework/vf-box',
    nameWithoutPrefix: 'vf-box',
    version: '1.4.0',
    packageJson: {
      version: '1.4.0',
    },
    config: {
      label: 'Box',
      status: 'live',
      title: 'vf-box',
    },
  });
});

test.serial('getConfig should extend a discovery item with their JS configuration', async (t) => {
  // arrange
  const loggerService = LoggerService.getInstance();
  loggerService.registerLogger('debug', 'test.log', true);

  const optionsService = OptionsService.getInstance();
  optionsService.setOptions({
    forceRun: false,
    logFile: '',
    loggingEnabled: false,
    profile: false,
    verbose: false,
    disabled: [],
    onlyOutdated: false,
  });

  const context: PipelineContext = {
    cache: {
      components: {},
      lockObjects: {},
    },
    rootDirectory: '',
    vfPackagePrefix: '',
  };

  const apiService = ApiService.getInstance();
  const getYamlComponentConfigStub = sinon.stub(apiService, 'getYamlComponentConfig');
  getYamlComponentConfigStub.withArgs('vf-box', context).resolves(null);
  const getJsComponentConfigStub = sinon.stub(apiService, 'getJsComponentConfig');
  getJsComponentConfigStub.withArgs('vf-box', context).resolves({
    label: 'Box',
    status: 'live',
    title: 'vf-box',
  });

  // act
  const { discoveryItem } = await getConfig(
    {
      discoveryItem: {
        name: '@visual-framework/vf-box',
        nameWithoutPrefix: 'vf-box',
        version: '1.4.0',
        packageJson: { version: '1.4.0' },
      },
      profilingInformation: {},
    },
    context,
  );

  // assert
  t.deepEqual(discoveryItem, {
    name: '@visual-framework/vf-box',
    nameWithoutPrefix: 'vf-box',
    version: '1.4.0',
    packageJson: {
      version: '1.4.0',
    },
    config: {
      label: 'Box',
      status: 'live',
      title: 'vf-box',
    },
  });
});

test.serial('getConfig should throw an error if no configuration has been found', async (t) => {
  // arrange
  const loggerService = LoggerService.getInstance();
  loggerService.registerLogger('debug', 'test.log', true);

  const optionsService = OptionsService.getInstance();
  optionsService.setOptions({
    forceRun: false,
    logFile: '',
    loggingEnabled: false,
    profile: false,
    verbose: false,
    disabled: [],
    onlyOutdated: false,
  });

  const context: PipelineContext = {
    cache: {
      components: {},
      lockObjects: {},
    },
    rootDirectory: '',
    vfPackagePrefix: '',
  };

  const apiService = ApiService.getInstance();
  const getYamlComponentConfigStub = sinon.stub(apiService, 'getYamlComponentConfig');
  getYamlComponentConfigStub.withArgs('vf-box', context).resolves(null);
  const getJsComponentConfigStub = sinon.stub(apiService, 'getJsComponentConfig');
  getJsComponentConfigStub.withArgs('vf-box', context).resolves(null);

  // act
  const error = await t.throwsAsync(
    getConfig(
      {
        discoveryItem: {
          name: '@visual-framework/vf-box',
          nameWithoutPrefix: 'vf-box',
          version: '1.4.0',
          packageJson: { version: '1.4.0' },
        },
        profilingInformation: {},
      },
      context,
    ),
  );

  // assert
  t.is(error.name, 'AppError');
});

test.serial('getConfig should throw an error when the name of the component is not specified', async (t) => {
  // assert
  const inputDiscoveryItem: PDiscoveryItem = {};
  const context: PipelineContext = {
    rootDirectory: '/test',
    vfPackagePrefix: '@visual-framework',
    cache: {
      components: {},
      lockObjects: {},
    },
  };

  // act
  const error = await t.throwsAsync(
    getConfig(
      {
        discoveryItem: inputDiscoveryItem,
        profilingInformation: {},
      },
      context,
    ),
  );

  // assert
  t.is(error.name, 'AppError');
});
