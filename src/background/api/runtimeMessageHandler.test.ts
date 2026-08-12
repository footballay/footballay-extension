import { describe, expect, it, vi } from 'vitest';

vi.mock('./footballayApi', () => ({
  getAvailableLeagues: vi.fn(),
  getFixtures: vi.fn(),
  getMatchData: vi.fn(),
}));

import { handleRuntimeMessage } from './runtimeMessageHandler';
import * as footballayApi from './footballayApi';

describe('runtime message handler', () => {
  it('accepts the declared available-leagues operation', async () => {
    vi.mocked(footballayApi.getAvailableLeagues).mockResolvedValueOnce([]);

    await expect(
      handleRuntimeMessage({ type: 'GET_AVAILABLE_LEAGUES' }),
    ).resolves.toEqual({ ok: true, data: [] });
  });

  it('accepts a declared fixture operation with its validated payload', async () => {
    vi.mocked(footballayApi.getFixtures).mockResolvedValueOnce([]);

    await expect(
      handleRuntimeMessage({
        type: 'GET_FIXTURES',
        payload: {
          leagueUid: 'league-1',
          date: '2026-08-11',
          mode: 'nearest',
          timezone: 'Asia/Seoul',
        },
      }),
    ).resolves.toEqual({ ok: true, data: [] });
    expect(footballayApi.getFixtures).toHaveBeenCalledWith({
      leagueUid: 'league-1',
      date: '2026-08-11',
      mode: 'nearest',
      timezone: 'Asia/Seoul',
    });
  });

  it('accepts a fixture match-data request', async () => {
    vi.mocked(footballayApi.getMatchData).mockResolvedValueOnce({} as never);

    await expect(
      handleRuntimeMessage({
        type: 'GET_MATCH_DATA',
        payload: { fixtureUid: 'fixture-1' },
      }),
    ).resolves.toEqual({ ok: true, data: {} });
    expect(footballayApi.getMatchData).toHaveBeenCalledWith('fixture-1');
  });

  it('rejects arbitrary or malformed proxy requests', async () => {
    await expect(
      handleRuntimeMessage({
        type: 'FETCH',
        payload: { url: 'https://example.com' },
      }),
    ).resolves.toEqual({
      ok: false,
      error: 'Invalid Footballay API request',
    });
    await expect(
      handleRuntimeMessage({ type: 'GET_AVAILABLE_LEAGUES', payload: {} }),
    ).resolves.toEqual({
      ok: false,
      error: 'Invalid Footballay API request',
    });
    await expect(
      handleRuntimeMessage({
        type: 'GET_AVAILABLE_LEAGUES',
        url: 'https://example.com',
      }),
    ).resolves.toEqual({
      ok: false,
      error: 'Invalid Footballay API request',
    });
    await expect(
      handleRuntimeMessage({
        type: 'GET_FIXTURES',
        payload: {
          leagueUid: 'league-1',
          date: '2026-02-30',
          mode: 'anything',
          timezone: 'Asia/Seoul',
        },
      }),
    ).resolves.toEqual({
      ok: false,
      error: 'Invalid Footballay API request',
    });
  });
});
