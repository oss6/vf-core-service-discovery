import fs from 'fs';
import { getVfCoreRepository } from '../helpers';
import { ChangelogItem, DiscoveryItem } from '../types';

function getComponentCumulativeChangelog(discoveryItem: DiscoveryItem): ChangelogItem[] {
  if (discoveryItem.version === discoveryItem.packageJson.version) {
    return [];
  }

  const name = discoveryItem.nameWithoutPrefix;
  const changelogFileName = getVfCoreRepository('components', name, 'CHANGELOG.md');
  const changelogContents = fs.readFileSync(changelogFileName, 'utf-8');
  const lines = changelogContents.split('\n');
  const changelog: ChangelogItem[] = [];
  let changelogItem: ChangelogItem | undefined = undefined;
  const versionRegex = /### (\d+\.\d+\.\d+)/;

  for (const line of lines) {
    if (line.startsWith('###')) {
      const versionRegexResult = versionRegex.exec(line);
      const version = versionRegexResult && versionRegexResult[1];

      if (!version) {
        continue;
      }

      if (changelogItem) {
        changelog.push(changelogItem);
      }

      if (version === discoveryItem.version) {
        break;
      }

      changelogItem = {
        version,
        changes: [],
      };
    } else if (line.startsWith('*') && changelogItem) {
      changelogItem.changes.push(line.replace(/^\*/, '').trim());
    }
  }

  return changelog;
}

export default function extendWithCumulativeChangelog(discoveryItems: DiscoveryItem[]): Promise<DiscoveryItem[]> {
  return new Promise<DiscoveryItem[]>((resolve) => {
    const processedDiscoveryItems = discoveryItems.map((discoveryItem) => ({
      ...discoveryItem,
      changelog: getComponentCumulativeChangelog(discoveryItem),
    }));

    resolve(processedDiscoveryItems);
  });
}
