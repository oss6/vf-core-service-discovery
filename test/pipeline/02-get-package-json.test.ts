import test from 'ava';
import sinon from 'sinon';
import ApiService from '../../src/services/api';
import getPackageJson from '../../src/pipeline/steps/02-get-package-json';
import LoggerService from '../../src/services/logger';
import OptionsService from '../../src/services/options';
import { PDiscoveryItem, PipelineContext } from '../../src/types';

test.afterEach(() => {
  sinon.restore();
});

test('getPackageJson should extend a discovery item with their package.json', async (t) => {
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
  const getComponentPackageJsonStub = sinon.stub(apiService, 'getComponentPackageJson');
  getComponentPackageJsonStub.withArgs('vf-box', context).resolves({ version: '1.4.1' });

  // act
  const { discoveryItem } = await getPackageJson(
    {
      discoveryItem: {
        name: '@visual-framework/vf-box',
        nameWithoutPrefix: 'vf-box',
        version: '1.4.0',
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
      version: '1.4.1',
    },
  });
});

test.serial('getPackageJson should throw an error when the name of the component is not specified', async (t) => {
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
    getPackageJson(
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
