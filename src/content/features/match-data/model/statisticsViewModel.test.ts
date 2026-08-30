import { describe, expect, it } from 'vitest';
import { createFixtureStatistics } from '@/content/test/matchDataFixtures';
import { buildStatisticsViewModel } from './statisticsViewModel';

describe('buildStatisticsViewModel', () => {
  it.each([
    ['Home Short', 'Away Short'],
    [null, null],
    [undefined as never, undefined as never],
    ['', ''],
    ['   ', '   '],
  ])(
    'uses %s and %s as the statistics team display names',
    (homeShortName, awayShortName) => {
      const statistics = createFixtureStatistics();
      statistics.home!.team.shortName = homeShortName;
      statistics.away!.team.shortName = awayShortName;

      expect(buildStatisticsViewModel(statistics)).toMatchObject({
        homeTeamName: homeShortName?.trim() || '홈',
        awayTeamName: awayShortName?.trim() || '원정',
      });
    },
  );

  it('maps columns, ratios, pass accuracy, cards, and latest xG', () => {
    const statistics = createFixtureStatistics();
    statistics.home!.teamStatistics.yellowCards = 2;
    statistics.home!.teamStatistics.redCards = 1;
    statistics.away!.teamStatistics.yellowCards = 3;
    statistics.away!.teamStatistics.redCards = 0;
    statistics.home!.teamStatistics.xg.push({ elapsed: 60, xg: '1.8' });
    statistics.away!.teamStatistics.xg.push({ elapsed: 60, xg: '1.1' });

    const view = buildStatisticsViewModel(statistics)!;
    const possession = view.columns[0]!.find(
      ({ label }) => label === 'possession',
    );
    const xg = view.columns[1]!.find(({ label }) => label === 'xG');

    expect(view.columns.map((column) => column.length)).toEqual([3, 6, 5]);
    expect(possession).toMatchObject({
      homeValue: '55%',
      awayValue: '45%',
      homeRatio: 55,
      awayRatio: 45,
    });
    expect(xg).toMatchObject({
      homeValue: '1.8',
      awayValue: '1.1',
      homeRatio: 62.1,
      awayRatio: 37.9,
    });
    expect(view.passAccuracy).toEqual({ home: 80, away: 78 });
    expect(view.cards).toEqual({
      homeYellow: 2,
      homeRed: 1,
      awayYellow: 3,
      awayRed: 0,
    });
    expect(view).toMatchObject({ homeTeamName: '홈', awayTeamName: '원정' });
  });

  it('omits goals prevented from the display columns while retaining other goalkeeper statistics', () => {
    const statistics = createFixtureStatistics();
    statistics.home!.teamStatistics.goalsPrevented = 2;
    statistics.away!.teamStatistics.goalsPrevented = 1;

    const rows = buildStatisticsViewModel(statistics)!.columns.flat();

    expect(
      rows.find(({ label }) => label === 'goalsPrevented'),
    ).toBeUndefined();
    expect(rows.find(({ label }) => label === 'goalkeeperSaves')).toBeTruthy();
  });

  it('uses a valid source pass accuracy before the pass count fallback', () => {
    const statistics = createFixtureStatistics();
    Object.assign(statistics.home!.teamStatistics, {
      passesAccuracyPercentage: 71,
      passesAccurate: 425,
      totalPasses: 500,
    });

    expect(buildStatisticsViewModel(statistics)!.passAccuracy.home).toBe(71);
  });

  it.each([
    [0, 556, 626, 89],
    [-1, 425, 500, 85],
    [101, 425, 500, 85],
  ])(
    'calculates pass accuracy from valid counts when source %s is invalid',
    (passesAccuracyPercentage, passesAccurate, totalPasses, expected) => {
      const statistics = createFixtureStatistics();
      Object.assign(statistics.home!.teamStatistics, {
        passesAccuracyPercentage,
        passesAccurate,
        totalPasses,
      });

      expect(buildStatisticsViewModel(statistics)!.passAccuracy.home).toBe(
        expected,
      );
    },
  );

  it('leaves pass accuracy undefined when source and counts are invalid', () => {
    const statistics = createFixtureStatistics();
    Object.assign(statistics.home!.teamStatistics, {
      passesAccuracyPercentage: Number.NaN,
      passesAccurate: 0,
      totalPasses: 500,
    });

    expect(
      buildStatisticsViewModel(statistics)!.passAccuracy.home,
    ).toBeUndefined();
  });

  it.each([
    [0, 500],
    [425, 0],
    [-1, 500],
    [501, 500],
    [Number.NaN, 500],
    [425, Number.POSITIVE_INFINITY],
  ])(
    'does not calculate pass accuracy from invalid counts: %s / %s',
    (passesAccurate, totalPasses) => {
      const statistics = createFixtureStatistics();
      Object.assign(statistics.home!.teamStatistics, {
        passesAccuracyPercentage: undefined as never,
        passesAccurate,
        totalPasses,
      });

      expect(
        buildStatisticsViewModel(statistics)!.passAccuracy.home,
      ).toBeUndefined();
    },
  );

  it('omits xG when neither team has a displayable latest value', () => {
    const statistics = createFixtureStatistics();
    statistics.home!.teamStatistics.xg = [];
    statistics.away!.teamStatistics.xg = [];

    expect(
      buildStatisticsViewModel(statistics)!.columns[1]!.find(
        ({ label }) => label === 'xG',
      ),
    ).toBeUndefined();
  });

  it.each(['0', '0.0'])('omits xG when both latest values are %s', (xg) => {
    const statistics = createFixtureStatistics();
    statistics.home!.teamStatistics.xg = [{ elapsed: 45, xg }];
    statistics.away!.teamStatistics.xg = [{ elapsed: 45, xg }];

    expect(
      buildStatisticsViewModel(statistics)!.columns[1]!.find(
        ({ label }) => label === 'xG',
      ),
    ).toBeUndefined();
  });

  it.each([null, undefined])(
    'omits xG when both latest values are missing: %s',
    (xg) => {
      const statistics = createFixtureStatistics();
      statistics.home!.teamStatistics.xg = [{ elapsed: 45, xg: xg as never }];
      statistics.away!.teamStatistics.xg = [{ elapsed: 45, xg: xg as never }];

      expect(
        buildStatisticsViewModel(statistics)!.columns[1]!.find(
          ({ label }) => label === 'xG',
        ),
      ).toBeUndefined();
    },
  );

  it('keeps xG when only one team has a displayable latest value', () => {
    const statistics = createFixtureStatistics();
    statistics.home!.teamStatistics.xg = [{ elapsed: 45, xg: '1.4' }];
    statistics.away!.teamStatistics.xg = [{ elapsed: 45, xg: '0' }];

    expect(
      buildStatisticsViewModel(statistics)!.columns[1]!.find(
        ({ label }) => label === 'xG',
      ),
    ).toMatchObject({
      homeValue: '1.4',
      awayValue: null,
      homeRatio: 100,
      awayRatio: 0,
    });
  });

  it('keeps xG when only the away team has a displayable latest value', () => {
    const statistics = createFixtureStatistics();
    statistics.home!.teamStatistics.xg = [{ elapsed: 45, xg: '0' }];
    statistics.away!.teamStatistics.xg = [{ elapsed: 45, xg: '0.8' }];

    expect(
      buildStatisticsViewModel(statistics)!.columns[1]!.find(
        ({ label }) => label === 'xG',
      ),
    ).toMatchObject({
      homeValue: null,
      awayValue: '0.8',
      homeRatio: 0,
      awayRatio: 100,
    });
  });

  it.each([[''], ['NaN'], ['Infinity'], ['-0.1']])(
    'does not use a historical xG value when the latest value is invalid: %s',
    (xg) => {
      const statistics = createFixtureStatistics();
      statistics.home!.teamStatistics.xg.push({ elapsed: 60, xg });
      statistics.away!.teamStatistics.xg = [{ elapsed: 45, xg: '0' }];

      expect(
        buildStatisticsViewModel(statistics)!.columns[1]!.find(
          ({ label }) => label === 'xG',
        ),
      ).toBeUndefined();
    },
  );
});
