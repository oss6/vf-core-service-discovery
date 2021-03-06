import { PDiscoveryItem } from '../../src/types';

export interface CustomFormatterFixtureItem {
  message: string;
  discoveryItem: PDiscoveryItem;
  format: string;
  expected: string;
}

export const customFormatterFixture: CustomFormatterFixtureItem[] = [
  {
    message: 'display name, used version, latest version, and status',
    discoveryItem: {
      nameWithoutPrefix: 'vf-box',
      version: '2.4.0',
      packageJson: {
        version: '2.5.1',
      },
      config: {
        label: 'Box',
        status: 'live',
        title: 'Box',
      },
    },
    format: '%name (%usedVersion, %latestVersion, %status)',
    expected: 'vf-box (2.4.0, 2.5.1, live)',
  },
  {
    message: 'display name and dependents',
    discoveryItem: {
      nameWithoutPrefix: 'vf-box',
      dependents: ['test.html', 'tmp.html'],
    },
    format: '%name\\n%dependents(- %dependent\\n)',
    expected: 'vf-box\n- test.html\n- tmp.html',
  },
  {
    message: 'display name and changelog',
    discoveryItem: {
      nameWithoutPrefix: 'vf-box',
      changelog: [
        {
          version: '2.0.1',
          changes: ['change1', 'change2'],
        },
        {
          version: '2.0.0',
          changes: ['change1', 'change2'],
        },
      ],
    },
    format: '%name\\n%changelog(%version\\n%changes(- %change\\n)\\n)',
    expected: 'vf-box\n2.0.1\n- change1\n- change2\n\n2.0.0\n- change1\n- change2',
  },
];
