import test from 'ava';
import { StringBuilder } from '../../src/helpers/string';
import { PipelineItem } from '../../src/types';
import onlyOutdatedFormatter from '../../src/reporters/cli-formatters/only-outdated-formatter';
import chalk from 'chalk';

test('onlyOutdatedFormatter should not build a string if the versions match', (t) => {
  // arrange
  const pipelineItem: PipelineItem = {
    profilingInformation: {},
    discoveryItem: {
      version: '2.4.0',
      packageJson: {
        version: '2.4.0',
      },
    },
  };

  const stringBuilder = new StringBuilder();

  // act
  onlyOutdatedFormatter(pipelineItem, stringBuilder);

  // assert
  t.is(stringBuilder.getValue(), '');
});

test('onlyOutdatedFormatter should build the formatted string if the versions mismatch', (t) => {
  // arrange
  const pipelineItem: PipelineItem = {
    profilingInformation: {},
    discoveryItem: {
      nameWithoutPrefix: 'vf-box',
      version: '2.3.1',
      packageJson: {
        version: '2.4.0',
      },
      config: {
        title: 'Box',
        label: 'Box',
        status: 'live',
      },
    },
  };

  const stringBuilder = new StringBuilder();

  // act
  onlyOutdatedFormatter(pipelineItem, stringBuilder);

  // assert
  const value = stringBuilder.getValue();
  t.true(value.includes(chalk.bold('vf-box (Box)')));
  t.true(value.includes(`(${chalk.red('2.3.1')} -> ${chalk.green('2.4.0')})`));
});
