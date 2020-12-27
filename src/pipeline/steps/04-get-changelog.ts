import semver from 'semver';
import { AppError } from '../../errors';
import ApiService from '../../services/api';
import LoggerService from '../../services/logger';
import { ChangelogItem, PDiscoveryItem } from '../../types';

export default async function getChangelog(discoveryItem: PDiscoveryItem): Promise<PDiscoveryItem> {
  const loggerService = LoggerService.getInstance();
  const logger = loggerService.getLogger();
  const apiService = ApiService.getInstance();

  if (!discoveryItem.version || !discoveryItem.packageJson || !discoveryItem.nameWithoutPrefix) {
    throw new AppError('Information not complete to get changelog.');
  }

  logger.debug(`${discoveryItem.nameWithoutPrefix} - retrieving changelog if applicable`);

  if (discoveryItem.version === discoveryItem.packageJson.version) {
    return discoveryItem;
  }

  const changelogContents = await apiService.getComponentChangelog(discoveryItem.nameWithoutPrefix);
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

      changelogItem = {
        version,
        changes: [],
      };
    } else if (line.startsWith('*') && changelogItem) {
      changelogItem.changes.push(line.replace(/^\*/, '').trim());
    }
  }

  const processedChangelog = changelog
    .sort((a, b) => semver.compare(b.version, a.version))
    .filter((changelogItem) => semver.gt(changelogItem.version, discoveryItem.version || ''));

  return {
    ...discoveryItem,
    changelog: processedChangelog,
  };
}
