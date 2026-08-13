import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosGet = vi.hoisted(() => vi.fn());
const axiosCreate = vi.hoisted(() => vi.fn(() => ({ get: axiosGet })));
vi.mock('axios', () => ({ default: { create: axiosCreate } }));

import {
  getAvailableLeagues,
  getFixtureStatus,
  getFixtures,
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

  it('uses the endpoint ETag and preserves a 304 response', async () => {
    axiosGet.mockResolvedValueOnce({
      status: 304,
      headers: { etag: 'etag-2' },
    });

    await expect(getFixtureStatus('fixture-1', 'etag-1')).resolves.toEqual({
      type: 'not-modified',
      etag: 'etag-2',
    });
    expect(axiosGet).toHaveBeenCalledWith(
      '/v1/football/fixtures/fixture-1/status',
      expect.objectContaining({
        headers: { 'If-None-Match': 'etag-1' },
        validateStatus: expect.any(Function),
      }),
    );
  });
});
