import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMatchData = vi.hoisted(() => vi.fn());
vi.mock('@/shared/footballayApiProtocol', () => ({ requestMatchData }));

import { useMatchDataStore } from './matchDataStore';

const response = {
  ok: true as const,
  data: {
    info: {
      fixtureUid: 'fixture-1',
      home: { name: 'Home', koreanName: '홈' },
      away: { name: 'Away', koreanName: '원정' },
    },
    status: {
      liveStatus: {
        shortStatus: '1H',
        elapsed: 12,
        score: { home: 1, away: 0 },
      },
    },
    statistics: {
      home: {
        teamStatistics: {
          ballPossession: 55,
          xg: [{ xg: '0.5' }],
          totalShots: 4,
          shotsOnGoal: 2,
          cornerKicks: 1,
          fouls: 3,
        },
      },
    },
    events: { events: [] },
    lineup: { lineup: {} },
  },
};

describe('match data store', () => {
  beforeEach(() => {
    requestMatchData.mockReset();
    useMatchDataStore.setState({
      data: undefined,
      status: 'idle',
      error: undefined,
    });
  });

  it('loads and maps selected fixture data once', async () => {
    requestMatchData.mockResolvedValueOnce(response);

    await useMatchDataStore.getState().loadMatchData('fixture-1');

    expect(requestMatchData).toHaveBeenCalledWith('fixture-1');
    expect(useMatchDataStore.getState()).toMatchObject({
      status: 'ready',
      data: {
        fixtureUid: 'fixture-1',
        homeTeamName: '홈',
        awayTeamName: '원정',
        homeScore: 1,
      },
    });
  });

  it('ignores an earlier fixture response', async () => {
    let resolveFirst!: (value: typeof response) => void;
    requestMatchData
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockResolvedValueOnce(response);

    const first = useMatchDataStore.getState().loadMatchData('fixture-old');
    await useMatchDataStore.getState().loadMatchData('fixture-1');
    resolveFirst({
      ...response,
      data: {
        ...response.data,
        info: { ...response.data.info, fixtureUid: 'fixture-old' },
      },
    });
    await first;

    expect(useMatchDataStore.getState().data?.fixtureUid).toBe('fixture-1');
  });
});
