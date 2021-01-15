import sub from 'date-fns/sub';
import { AppConfig } from '../../src/types';

export interface ShouldInvalidateFixtureItem {
  input: AppConfig;
  expected: boolean;
}

export const shouldInvalidateFixture: ShouldInvalidateFixtureItem[] = [
  {
    input: {
      cacheExpiry: '5h',
      lastInvalidation: null,
      vfCoreVersion: 'v2.1.2',
    },
    expected: true,
  },
  {
    input: {
      cacheExpiry: '3h',
      lastInvalidation: sub(new Date(), { hours: 5 }),
      vfCoreVersion: 'v2.1.2',
    },
    expected: true,
  },
  {
    input: {
      cacheExpiry: '3h',
      lastInvalidation: sub(new Date(), { hours: 1 }),
      vfCoreVersion: 'v2.1.2',
    },
    expected: false,
  },
];
