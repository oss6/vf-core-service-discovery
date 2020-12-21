import test from 'ava';
import { asyncFlow, parseRelativeTime, zipMap } from '../src/helpers';
import { PipelineItem } from '../src/types';

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

test('asyncFlow should return the correct result when successful', async (t) => {
  // arrange
  const pipeline: PipelineItem[] = [
    () => Promise.resolve(10),
    (n) => Promise.resolve(n * 2),
    (n) => Promise.resolve(`Result: ${n}`),
  ];

  // act
  const result = await asyncFlow(...pipeline);

  // assert
  t.is(result, 'Result: 20');
});

test('asyncFlow should fail if a step fails', async (t) => {
  // arrange
  const pipeline: PipelineItem[] = [
    () => Promise.resolve(10),
    () => Promise.reject(new Error('Custom error')),
    (n) => Promise.resolve(`Result: ${n}`),
  ];

  // act
  const resultPromise = asyncFlow(...pipeline);

  // assert
  const error = await t.throwsAsync(resultPromise);
  t.is(error.message, 'Custom error');
});

test('zipMap should return the correct result', (t) => {
  // arrange
  interface FixtureItem {
    mapper: (...args: any) => any;
    arrays: any[][];
    expectedOutput: any[];
  }

  const fixture: FixtureItem[] = [
    {
      mapper: (a, b) => a,
      arrays: [
        [1, 2, 3],
        ['a', 'b', 'c'],
      ],
      expectedOutput: [1, 2, 3],
    },
    {
      mapper: (a, b) => `${a}${b}`,
      arrays: [
        [1, 2, 3],
        ['a', 'b', 'c'],
      ],
      expectedOutput: ['1a', '2b', '3c'],
    },
    {
      mapper: (a, b) => `${a}${b}`,
      arrays: [
        [1, 2, 3],
        ['a', 'b', 'c', 'd', 'e', 'f'],
      ],
      expectedOutput: ['1a', '2b', '3c'],
    },
  ];

  // act & assert
  for (const { mapper, arrays, expectedOutput } of fixture) {
    const actualOutput = zipMap(mapper, ...arrays);

    t.deepEqual(actualOutput, expectedOutput);
  }
});
