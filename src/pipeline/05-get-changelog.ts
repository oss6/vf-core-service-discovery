import { zipMap } from '../helpers';
import ApiService from '../services/api';
import { ChangelogItem, DiscoveryItemStep04, DiscoveryItemStep05 } from '../types';

async function getComponentCumulativeChangelog(discoveryItem: DiscoveryItemStep04): Promise<ChangelogItem[]> {
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

export default async function extendWithCumulativeChangelog(
  discoveryItems: DiscoveryItemStep04[],
): Promise<DiscoveryItemStep05[]> {
  const changelogs = await Promise.all(discoveryItems.map(getComponentCumulativeChangelog));

  const processedDiscoveryItems: DiscoveryItemStep05[] = zipMap(
    (discoveryItem, changelog) =>
      ({
        ...discoveryItem,
        changelog,
      } as DiscoveryItemStep05),
    discoveryItems,
    changelogs,
  );

  return processedDiscoveryItems;
}
