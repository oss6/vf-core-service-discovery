import test from 'ava';
import sinon from 'sinon';
import ApiService from '../../src/services/api';
import getChangelog from '../../src/pipeline/steps/04-get-changelog';
import { exampleChangelog } from '../fixture/04-get-changelog.fixture';
import LoggerService from '../../src/services/logger';
import OptionsService from '../../src/services/options';
import { PDiscoveryItem, PipelineContext, PipelineItem } from '../../src/types';

test.serial.afterEach(() => {
  sinon.restore();
});

test.serial('getChangelog should extend a discovery item with its changelog if applicable', async (t) => {
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
    dependentsIgnore: [],
    dependentsProjectType: 'autoDetect',
  });

  const context: PipelineContext = {
    cache: {
      components: {},
      lockObjects: {},
    },
    rootDirectory: '',
    vfPackagePrefix: '',
    potentialDependents: [],
  };

  const apiService = ApiService.getInstance();
  const getComponentChangelog = sinon.stub(apiService, 'getComponentChangelog');
  getComponentChangelog.withArgs('vf-footer', context).resolves(exampleChangelog);

  // act
  const { discoveryItem } = await getChangelog(
    {
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
    },
    context,
  );

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

test.serial(
  'getChangelog should not extend the discovery item when the installed and the latest versions are the same',
  async (t) => {
    // arrange
    const loggerService = LoggerService.getInstance();
    loggerService.registerLogger('debug', 'test.log', true);

    const context: PipelineContext = {
      cache: {
        components: {},
        lockObjects: {},
      },
      rootDirectory: '',
      vfPackagePrefix: '',
      potentialDependents: [],
    };

    const pipelineItem: PipelineItem = {
      discoveryItem: {
        name: '@visual-framework/vf-footer',
        nameWithoutPrefix: 'vf-footer',
        version: '1.1.0',
        packageJson: { version: '1.1.0' },
        config: {
          label: 'Footer',
          status: 'live',
          title: 'vf-footer',
        },
      },
      profilingInformation: {},
    };

    // act
    const actualPipelineItem = await getChangelog(pipelineItem, context);

    // assert
    t.deepEqual(actualPipelineItem, pipelineItem);
  },
);

test.serial('getChangelog should throw an error when the name of the component is not specified', async (t) => {
  // assert
  const inputDiscoveryItem: PDiscoveryItem = {};
  const context: PipelineContext = {
    rootDirectory: '/test',
    vfPackagePrefix: '@visual-framework',
    cache: {
      components: {},
      lockObjects: {},
    },
    potentialDependents: [],
  };

  // act
  const error = await t.throwsAsync(
    getChangelog(
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
