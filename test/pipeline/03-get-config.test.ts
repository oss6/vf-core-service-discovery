import test from 'ava';
import sinon from 'sinon';
import ApiService from '../../src/services/api';
import getConfig from '../../src/pipeline/steps/03-get-config';
import LoggerService from '../../src/services/logger';

test.afterEach(() => {
  sinon.restore();
});

test('getConfig should extend a discovery item with their configuration', async (t) => {
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

  // act
  const discoveryItem = await getConfig({
    name: '@visual-framework/vf-box',
    nameWithoutPrefix: 'vf-box',
    version: '1.4.0',
    packageJson: { version: '1.4.0' },
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
