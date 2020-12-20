import { zipMap } from '../helpers';
import ApiService from '../services/api';
import { ChangelogItem, DiscoveryItem } from '../types';

async function getComponentCumulativeChangelog(discoveryItem: DiscoveryItem): Promise<ChangelogItem[]> {
  if (discoveryItem.version === discoveryItem.packageJson.version) {
    return [];
  }

  const apiService = ApiService.getInstance();
  const name = discoveryItem.nameWithoutPrefix;
  const changelogContents = await apiService.getComponentChangelog(name);
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

export default async function extendWithCumulativeChangelog(discoveryItems: DiscoveryItem[]): Promise<DiscoveryItem[]> {
  const changelogs = await Promise.all(discoveryItems.map(getComponentCumulativeChangelog));

  const processedDiscoveryItems: DiscoveryItem[] = zipMap(
    (discoveryItem, changelog) =>
      ({
        ...discoveryItem,
        changelog,
      } as DiscoveryItem),
    discoveryItems,
    changelogs,
  );

  return processedDiscoveryItems;
}
