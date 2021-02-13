import { StringBuilder } from '../../helpers/string';
import { ChangelogItem, DiscoveryItem, PipelineItem } from '../../types';

const formatCommandsRegex = /%name|%usedVersion|%latestVersion|%status|%changelog\(.*\)|%dependents\(.*\)|\\n/gm;
const changelogFormatCommandsRegex = /%version|%changes\(.*\)|\\n/gm;
const changelogChangesFormatCommandsRegex = /%change|\\n/g;
const dependentFormatCommandsRegex = /%dependent|\\n/gm;

function changelogChangesReplace(change: string) {
  return (match: string): string => {
    switch (match) {
      case '\\n':
        return '\n';
      case '%change':
        return change;
      default:
        return '';
    }
  };
}

function changelogReplacer(changelog: ChangelogItem) {
  return (match: string): string => {
    switch (match) {
      case '\\n':
        return '\n';
      case '%version':
        return changelog.version;
      default:
        if (match.includes('%changes') && changelog.changes?.length > 0) {
          const replacedChanges = match.replace(/%changes\((.*)\)/gm, '$1');
          return changelog.changes
            .map((change) =>
              replacedChanges.replace(changelogChangesFormatCommandsRegex, changelogChangesReplace(change)),
            )
            .join('');
        }
        return '';
    }
  };
}

function dependentReplacer(dependent: string) {
  return (match: string): string => {
    switch (match) {
      case '\\n':
        return '\n';
      case '%dependent':
        return dependent;
      default:
        return '';
    }
  };
}

export default function customFormatter(
  { discoveryItem: ds }: PipelineItem,
  format: string,
  stringBuilder: StringBuilder,
): void {
  const discoveryItem = ds as DiscoveryItem;
  let outputString = '';

  outputString = format.replace(formatCommandsRegex, (match) => {
    switch (match) {
      case '\\n':
        return '\n';
      case '%name':
        return discoveryItem.nameWithoutPrefix;
      case '%usedVersion':
        return discoveryItem.version;
      case '%latestVersion':
        return discoveryItem.packageJson.version;
      case '%status':
        return discoveryItem.config.status;
      default:
        if (match.includes('%dependents') && discoveryItem.dependents?.length > 0) {
          const replacedDependents = match.replace(/%dependents\((.*)\)/, '$1');
          return discoveryItem.dependents
            .map((dependent) => replacedDependents.replace(dependentFormatCommandsRegex, dependentReplacer(dependent)))
            .join('');
        } else if (match.includes('%changelog') && discoveryItem.changelog?.length > 0) {
          const replacedChangelog = match.replace(/%changelog\((.*)\)/gm, '$1');
          return discoveryItem.changelog
            .map((changelog) => replacedChangelog.replace(changelogFormatCommandsRegex, changelogReplacer(changelog)))
            .join('');
        }
        return '';
    }
  });

  stringBuilder.add(outputString);
  stringBuilder.addNewLine();
}
