import { describe, expect, it } from 'vitest';
import {
  getFixtureStatusGroup,
  type FixtureStatusGroup,
} from './fixtureStatus';

const cases: Array<[FixtureStatusGroup, string[]]> = [
  ['upcoming', ['TBD', 'NS']],
  ['playing', ['1H', '2H', 'ET', 'P', 'LIVE']],
  ['paused', ['HT', 'BT', 'SUSP', 'INT']],
  ['finished', ['FT', 'AET', 'PEN']],
  ['not-played', ['PST', 'CANC', 'ABD', 'AWD', 'WO']],
  ['unknown', ['unknown', '']],
];

describe('getFixtureStatusGroup', () => {
  it.each(cases)('maps %s statuses', (group, statuses) => {
    for (const status of statuses) {
      expect(getFixtureStatusGroup(status)).toBe(group);
    }
  });
});
