import test from 'ava';
import sinon from 'sinon';
import ApiService from '../../src/services/api';
import extendWithComponentConfig from '../../src/pipeline/04-get-component-config';
import { DiscoveryItemStep03 } from '../../src/types';
import LoggerService from '../../src/services/logger';

test.afterEach(() => {
  sinon.restore();
});

test('extendWithComponentConfig should extend discovery items with their configuration', async (t) => {
  // arrange
  const loggerService = LoggerService.getInstance();
  loggerService.registerLogger('debug', 'test.log', true);

  const apiService = ApiService.getInstance();
  const getComponentConfigStub = sinon.stub(apiService, 'getComponentConfig');
  getComponentConfigStub.withArgs('vf-box').resolves({
    label: 'Box',
    status: 'live',
    title: 'vf-box',
  });
  getComponentConfigStub.withArgs('vf-footer').resolves({
    label: 'Footer',
    status: 'live',
    title: 'vf-footer',
  });

  const discoveryItems: DiscoveryItemStep03[] = [
    {
      name: '@visual-framework/vf-box',
      nameWithoutPrefix: 'vf-box',
      version: '1.4.0',
      packageJson: { version: '1.4.0' },
    },
    {
      name: '@visual-framework/vf-footer',
      nameWithoutPrefix: 'vf-footer',
      version: '1.4.7',
      packageJson: { version: '1.4.7' },
    },
  ];

  // act
  const processedDiscoveryItems = await extendWithComponentConfig(discoveryItems);

  // assert
  t.deepEqual(processedDiscoveryItems, [
    {
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
    },
    {
      name: '@visual-framework/vf-footer',
      nameWithoutPrefix: 'vf-footer',
      version: '1.4.7',
      packageJson: {
        version: '1.4.7',
      },
      config: {
        label: 'Footer',
        status: 'live',
        title: 'vf-footer',
      },
    },
  ]);
});
