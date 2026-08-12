import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosGet = vi.hoisted(() => vi.fn());
const axiosCreate = vi.hoisted(() => vi.fn(() => ({ get: axiosGet })));
vi.mock('axios', () => ({ default: { create: axiosCreate } }));

import {
  getAvailableLeagues,
  getFixtures,
  getMatchData,
} from './footballayApi';

describe('Footballay privileged API transport', () => {
  beforeEach(() => axiosGet.mockReset());

  it('retrieves the raw available-league response from its declared endpoint', async () => {
    const response = [
      { uid: 'league-1', name: 'Premier League', nameKo: '프리미어리그' },
    ];
    axiosGet.mockResolvedValueOnce({ data: response });

    await expect(getAvailableLeagues()).resolves.toEqual(response);
    expect(axiosGet).toHaveBeenCalledWith('/v1/football/leagues/available');
  });

  it('retrieves raw fixtures with the declared league query', async () => {
    const response = [{ uid: 'fixture-1' }];
    axiosGet.mockResolvedValueOnce({ data: response });

    await expect(
      getFixtures({
        leagueUid: 'league / 1',
        date: '2026-08-11',
        mode: 'nearest',
        timezone: 'Asia/Seoul',
      }),
    ).resolves.toEqual(response);
    expect(axiosGet).toHaveBeenCalledWith(
      '/v1/football/leagues/league%20%2F%201/fixtures?date=2026-08-11&mode=nearest&timezone=Asia%2FSeoul',
    );
  });

  it('retrieves all match data endpoints in one fixture load', async () => {
    axiosGet
      .mockResolvedValueOnce({ data: { fixtureUid: 'fixture-1' } })
      .mockResolvedValueOnce({
        data: { liveStatus: { shortStatus: 'NS', score: {} } },
      })
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: { events: [] } })
      .mockResolvedValueOnce({ data: { lineup: {} } });

    await expect(getMatchData('fixture / 1')).resolves.toEqual({
      info: { fixtureUid: 'fixture-1' },
      status: { liveStatus: { shortStatus: 'NS', score: {} } },
      statistics: {},
      events: { events: [] },
      lineup: { lineup: {} },
    });
    expect(axiosGet).toHaveBeenCalledWith(
      '/v1/football/fixtures/fixture%20%2F%201/info',
    );
    expect(axiosGet).toHaveBeenCalledWith(
      '/v1/football/fixtures/fixture%20%2F%201/lineup',
    );
  });
});
