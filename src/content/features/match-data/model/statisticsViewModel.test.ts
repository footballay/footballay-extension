import { describe, expect, it } from 'vitest';
import { createFixtureStatistics } from '@/content/test/matchDataFixtures';
import { buildStatisticsViewModel } from './statisticsViewModel';

describe('buildStatisticsViewModel', () => {
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

    expect(view.columns.map((column) => column.length)).toEqual([3, 6, 6]);
    expect(possession).toMatchObject({
      homeValue: '55%',
      awayValue: '45%',
      homeRatio: 55,
      awayRatio: 45,
    });
    expect(xg).toMatchObject({ homeValue: '1.8', awayValue: '1.1' });
    expect(view.passAccuracy).toEqual({ home: 80, away: 78 });
    expect(view.cards).toEqual({
      homeYellow: 2,
      homeRed: 1,
      awayYellow: 3,
      awayRed: 0,
    });
    expect(view).toMatchObject({ homeTeamName: '홈', awayTeamName: '원정' });
  });

  it('uses the source pass accuracy before the pass count fallback', () => {
    const statistics = createFixtureStatistics();
    Object.assign(statistics.home!.teamStatistics, {
      passesAccuracyPercentage: 71,
      passesAccurate: 425,
      totalPasses: 500,
    });

    expect(buildStatisticsViewModel(statistics)!.passAccuracy.home).toBe(71);
  });

  it('calculates pass accuracy from valid pass counts', () => {
    const statistics = createFixtureStatistics();
    Object.assign(statistics.home!.teamStatistics, {
      passesAccuracyPercentage: undefined as never,
      passesAccurate: 425,
      totalPasses: 500,
    });

    expect(buildStatisticsViewModel(statistics)!.passAccuracy.home).toBe(85);
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
});
