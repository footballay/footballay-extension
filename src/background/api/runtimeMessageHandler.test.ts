import { describe, expect, it, vi } from 'vitest';

vi.mock('./footballayApi', () => ({
  getAvailableLeagues: vi.fn(),
  getFixtures: vi.fn(),
  getFixtureDates: vi.fn(),
  getFixtureStatus: vi.fn(),
  getFixtureLineup: vi.fn(),
  getFixtureEvents: vi.fn(),
  getFixtureStatistics: vi.fn(),
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
  });

  it('accepts only a valid fixture-date range request', async () => {
    vi.mocked(footballayApi.getFixtureDates).mockResolvedValueOnce([
      '2026-08-22',
    ]);

    await expect(
      handleRuntimeMessage({
        type: 'GET_FIXTURE_DATES',
        payload: {
          leagueUid: 'league-1',
          startDate: '2026-07-26',
          endDate: '2026-09-05',
          timezone: 'Asia/Seoul',
        },
      }),
    ).resolves.toEqual({ ok: true, data: ['2026-08-22'] });
  });

  it('passes a fixture endpoint ETag through the validated boundary', async () => {
    vi.mocked(footballayApi.getFixtureStatus).mockResolvedValueOnce({
      type: 'not-modified',
    });

    await expect(
      handleRuntimeMessage({
        type: 'GET_FIXTURE_STATUS',
        payload: { fixtureUid: 'fixture-1', etag: 'etag-1' },
      }),
    ).resolves.toEqual({ ok: true, data: { type: 'not-modified' } });
    expect(footballayApi.getFixtureStatus).toHaveBeenCalledWith(
      'fixture-1',
      'etag-1',
    );
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
      handleRuntimeMessage({
        type: 'GET_FIXTURE_STATUS',
        payload: { fixtureUid: 'fixture-1', etag: 1 },
      }),
    ).resolves.toEqual({
      ok: false,
      error: 'Invalid Footballay API request',
    });
  });
});
