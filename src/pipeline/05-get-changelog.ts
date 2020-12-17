import fs from 'fs';
import App from '../app';
import { ChangelogItem, DiscoveryItem } from '../types';

function getComponentCumulativeChangelog(discoveryItem: DiscoveryItem): ChangelogItem[] {
  const app = App.getInstance();
  const name = discoveryItem.nameWithoutPrefix;
  const changelogFileName = app.getVfCoreRepository('components', name, 'CHANGELOG.md');
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
        changes: []
      };
    } else if (line.startsWith('*') && changelogItem) {
      changelogItem.changes.push(line.replace(/^\*/, '').trim());
    }
  }

  return changelog;
}

export default function extendWithCumulativeChangelog(discoveryItems: DiscoveryItem[]): Promise<DiscoveryItem[]> {
  return new Promise<DiscoveryItem[]>((resolve, reject) => {
    const processedDiscoveryItems = discoveryItems.map((discoveryItem) => ({
      ...discoveryItem,
      changelog: getComponentCumulativeChangelog(discoveryItem)
    }));

    resolve(processedDiscoveryItems);
  });
}
