import test from 'ava';
import sinon from 'sinon';
import ApiService from '../../src/services/api';
import getPackageJson from '../../src/pipeline/steps/02-get-package-json';
import LoggerService from '../../src/services/logger';
import OptionsService from '../../src/services/options';

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
  });

  const apiService = ApiService.getInstance();
  const getComponentPackageJsonStub = sinon.stub(apiService, 'getComponentPackageJson');
  getComponentPackageJsonStub.withArgs('vf-box').resolves({ version: '1.4.1' });

  // act
  const { discoveryItem } = await getPackageJson({
    discoveryItem: {
      name: '@visual-framework/vf-box',
      nameWithoutPrefix: 'vf-box',
      version: '1.4.0',
    },
    profilingInformation: {},
  });

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
