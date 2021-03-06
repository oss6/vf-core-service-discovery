import test from 'ava';
import { StringBuilder } from '../../src/helpers/string';
import { PipelineItem } from '../../src/types';
import customFormatter from '../../src/reporters/cli-formatters/custom-formatter';
import { customFormatterFixture } from '../fixture/custom-formatter.fixture';

customFormatterFixture.forEach(({ format, discoveryItem, expected, message }) => {
  test(`customFormatter should ${message}`, (t) => {
    // arrange
    const pipelineItem: PipelineItem = {
      profilingInformation: {},
      discoveryItem,
    };

    const stringBuilder = new StringBuilder();

    // act
    customFormatter(pipelineItem, format, stringBuilder);

    // assert
    const value = stringBuilder.getValue();
    t.true(value.includes(expected));
  });
});
