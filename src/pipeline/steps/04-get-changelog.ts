import semver from 'semver';
import { AppError } from '../../errors';
import { runAndMeasure } from '../../helpers/misc';
import ApiService from '../../services/api';
import LoggerService from '../../services/logger';
import OptionsService from '../../services/options';
import { ChangelogItem, PipelineContext, PipelineItem } from '../../types';

/**
 * Returns the changelog if the installed version is different than the latest version.
 * @param pipelineItem The pipeline item to process.
 */
export default async function getChangelog(
  { discoveryItem, profilingInformation }: PipelineItem,
  context: PipelineContext,
): Promise<PipelineItem> {
  const loggerService = LoggerService.getInstance();
  const logger = loggerService.getLogger();
  const apiService = ApiService.getInstance();
  const optionsService = OptionsService.getInstance();
  const { profile } = optionsService.getOptions();

  if (!discoveryItem.version || !discoveryItem.packageJson || !discoveryItem.nameWithoutPrefix) {
    throw new AppError('Information not complete to get changelog.');
  }

  logger.debug(`${discoveryItem.nameWithoutPrefix} - retrieving changelog if applicable`);

  if (discoveryItem.version === discoveryItem.packageJson.version) {
    return {
      discoveryItem,
      profilingInformation,
    };
  }

  const { result: changelog, took } = await runAndMeasure(async () => {
    const changelogContents = await apiService.getComponentChangelog(
      discoveryItem.nameWithoutPrefix as string,
      context,
    );
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

    return processedChangelog;
  }, profile);

  return {
    discoveryItem: {
      ...discoveryItem,
      changelog,
    },
    profilingInformation: {
      ...profilingInformation,
      getChangelog: took,
    },
  };
}
