import test from 'ava';
import sinon from 'sinon';
import ApiService from '../../src/services/api';
import getChangelog from '../../src/pipeline/steps/04-get-changelog';
import { exampleChangelog } from '../fixture/04-get-changelog.fixture';
import LoggerService from '../../src/services/logger';
import OptionsService from '../../src/services/options';

test.afterEach(() => {
  sinon.restore();
});

test('getChangelog should extend a discovery item with its changelog if applicable', async (t) => {
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
  const getComponentChangelog = sinon.stub(apiService, 'getComponentChangelog');
  getComponentChangelog.withArgs('vf-footer').resolves(exampleChangelog);

  // act
  const { discoveryItem } = await getChangelog({
    discoveryItem: {
      name: '@visual-framework/vf-footer',
      nameWithoutPrefix: 'vf-footer',
      version: '1.0.3',
      packageJson: { version: '1.1.0' },
      config: {
        label: 'Footer',
        status: 'live',
        title: 'vf-footer',
      },
    },
    profilingInformation: {},
  });

  // assert
  t.deepEqual(discoveryItem, {
    name: '@visual-framework/vf-footer',
    nameWithoutPrefix: 'vf-footer',
    version: '1.0.3',
    packageJson: { version: '1.1.0' },
    config: {
      label: 'Footer',
      status: 'live',
      title: 'vf-footer',
    },
    changelog: [
      {
        version: '1.1.0',
        changes: ["removes inline padding as it's defunct when using the `vf-body` component"],
      },
      {
        version: '1.0.6',
        changes: ['dependency bump'],
      },
    ],
  });
});
