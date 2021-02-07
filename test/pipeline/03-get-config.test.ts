import test from 'ava';
import sinon from 'sinon';
import ApiService from '../../src/services/api';
import getConfig from '../../src/pipeline/steps/03-get-config';
import LoggerService from '../../src/services/logger';
import OptionsService from '../../src/services/options';

test.afterEach(() => {
  sinon.restore();
});

test('getConfig should extend a discovery item with their configuration', async (t) => {
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
  const getYamlComponentConfigStub = sinon.stub(apiService, 'getYamlComponentConfig');
  getYamlComponentConfigStub.withArgs('vf-box').resolves({
    label: 'Box',
    status: 'live',
    title: 'vf-box',
  });
  const getJsComponentConfigStub = sinon.stub(apiService, 'getJsComponentConfig');
  getJsComponentConfigStub.withArgs('vf-box').resolves(null);

  // act
  const { discoveryItem } = await getConfig({
    discoveryItem: {
      name: '@visual-framework/vf-box',
      nameWithoutPrefix: 'vf-box',
      version: '1.4.0',
      packageJson: { version: '1.4.0' },
    },
    profilingInformation: {},
  });

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
