import test from 'ava';
import { parseRelativeTime } from '../src/helpers/misc';

test('parseRelativeTime should return the correct values', (t) => {
  // arrange
  interface FixtureItem {
    relativeTime: string;
    fromDate: Date;
    expectedOutput: string;
  }

  const fixture: FixtureItem[] = [
    {
      relativeTime: '5h',
      fromDate: new Date(2020, 10, 5, 11, 5, 0),
      expectedOutput: '2020-11-05T16:05:00',
    },
    {
      relativeTime: '1h 3m 10s',
      fromDate: new Date(2020, 10, 5, 11, 5, 0),
      expectedOutput: '2020-11-05T12:08:10',
    },
    {
      relativeTime: '2D 3h',
      fromDate: new Date(2020, 10, 5, 11, 5, 0),
      expectedOutput: '2020-11-07T14:05:00',
    },
  ];

  // act & assert
  for (const { relativeTime, fromDate, expectedOutput } of fixture) {
    const actualOutput = parseRelativeTime(relativeTime, fromDate).toISOString().replace(/\..*/g, '');

    t.is(actualOutput, expectedOutput);
  }
});
