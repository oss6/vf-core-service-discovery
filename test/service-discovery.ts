import test from 'ava';
import { DiscoveryItem } from '../src/core/definitions';
import { getComponentCumulativeChangelog } from '../src/service-discovery';

test('cumulative changelog', t => {
  getComponentCumulativeChangelog({
    nameWithoutPrefix: 'vf-box',
    version: '2.0.0'
  } as DiscoveryItem);
});
