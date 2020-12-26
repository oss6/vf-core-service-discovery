import test from 'ava';
import sinon from 'sinon';
import ApiService from '../../src/services/api';
import extendWithComponentPackageJson from '../../src/pipeline/03-get-components-package-json';
import { DiscoveryItemStep02 } from '../../src/types';
import LoggerService from '../../src/services/logger';

test.afterEach(() => {
  sinon.restore();
});

test('extendWithComponentPackageJson should extend discovery items with their package.json', async (t) => {
  // arrange
  const loggerService = LoggerService.getInstance();
  loggerService.registerLogger('debug', 'test.log', true);

  const apiService = ApiService.getInstance();
  const getComponentPackageJsonStub = sinon.stub(apiService, 'getComponentPackageJson');
  getComponentPackageJsonStub.withArgs('vf-box').resolves({ version: '1.4.1' });
  getComponentPackageJsonStub.withArgs('vf-footer').resolves({ version: '1.5.0' });

  const discoveryItems: DiscoveryItemStep02[] = [
    {
      name: '@visual-framework/vf-box',
      nameWithoutPrefix: 'vf-box',
      version: '1.4.0',
    },
    {
      name: '@visual-framework/vf-footer',
      nameWithoutPrefix: 'vf-footer',
      version: '1.4.7',
    },
  ];

  // act
  const processedDiscoveryItems = await extendWithComponentPackageJson(discoveryItems);

  // assert
  t.deepEqual(processedDiscoveryItems, [
    {
      name: '@visual-framework/vf-box',
      nameWithoutPrefix: 'vf-box',
      version: '1.4.0',
      packageJson: {
        version: '1.4.1',
      },
    },
    {
      name: '@visual-framework/vf-footer',
      nameWithoutPrefix: 'vf-footer',
      version: '1.4.7',
      packageJson: {
        version: '1.5.0',
      },
    },
  ]);
});
