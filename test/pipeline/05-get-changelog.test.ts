import test from 'ava';
import sinon from 'sinon';
import ApiService from '../../src/services/api';
import extendWithCumulativeChangelog from '../../src/pipeline/05-get-changelog';
import { DiscoveryItemStep04 } from '../../src/types';
import { exampleChangelog } from '../fixture/05-get-changelog.fixture';

test.afterEach(() => {
  sinon.restore();
});

test('extendWithCumulativeChangelog should extend discovery items with changelog if applicable', async (t) => {
  // arrange
  const apiService = ApiService.getInstance();
  const getComponentChangelog = sinon.stub(apiService, 'getComponentChangelog');
  getComponentChangelog.withArgs('vf-box').resolves('');
  getComponentChangelog.withArgs('vf-footer').resolves(exampleChangelog);

  const discoveryItems: DiscoveryItemStep04[] = [
    {
      name: '@visual-framework/vf-box',
      nameWithoutPrefix: 'vf-box',
      version: '1.4.0',
      packageJson: { version: '1.4.0' },
      config: {
        label: 'Box',
        status: 'live',
        title: 'vf-box',
      },
    },
    {
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
  ];

  // act
  const processedDiscoveryItems = await extendWithCumulativeChangelog(discoveryItems);

  // assert
  t.deepEqual(processedDiscoveryItems, [
    {
      name: '@visual-framework/vf-box',
      nameWithoutPrefix: 'vf-box',
      version: '1.4.0',
      packageJson: { version: '1.4.0' },
      config: {
        label: 'Box',
        status: 'live',
        title: 'vf-box',
      },
      changelog: [],
    },
    {
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
    },
  ]);
});
