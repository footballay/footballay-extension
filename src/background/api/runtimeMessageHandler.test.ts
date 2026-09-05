import { afterEach, describe, expect, it, vi } from 'vitest';

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

function coupangSender(tabId: number): chrome.runtime.MessageSender {
  return {
    tab: { id: tabId } as chrome.tabs.Tab,
    url: `https://www.coupangplay.com/watch/${tabId}`,
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('runtime message handler', () => {
  it('accepts the declared available-leagues operation', async () => {
    vi.mocked(footballayApi.getAvailableLeagues).mockResolvedValueOnce([]);

    await expect(
      handleRuntimeMessage({ type: 'GET_AVAILABLE_LEAGUES' }),
    ).resolves.toEqual({ ok: true, data: [] });
  });

  it('passes localeOverride only through localized operations', async () => {
    vi.mocked(footballayApi.getAvailableLeagues).mockResolvedValueOnce([]);
    vi.mocked(footballayApi.getFixtures).mockResolvedValueOnce([]);
    vi.mocked(footballayApi.getFixtureLineup).mockResolvedValueOnce({
      type: 'not-modified',
    });

    await handleRuntimeMessage({
      type: 'GET_AVAILABLE_LEAGUES',
      payload: { localeOverride: 'ko' },
    });
    await handleRuntimeMessage({
      type: 'GET_FIXTURES',
      payload: {
        leagueUid: 'league-1',
        date: '2026-08-11',
        mode: 'nearest',
        timezone: 'Asia/Seoul',
        localeOverride: 'en',
      },
    });
    await handleRuntimeMessage({
      type: 'GET_FIXTURE_LINEUP',
      payload: { fixtureUid: 'fixture-1', localeOverride: 'ko' },
    });

    expect(footballayApi.getAvailableLeagues).toHaveBeenCalledWith('ko');
    expect(footballayApi.getFixtures).toHaveBeenCalledWith(
      expect.objectContaining({ localeOverride: 'en' }),
    );
    expect(footballayApi.getFixtureLineup).toHaveBeenCalledWith(
      'fixture-1',
      undefined,
      'ko',
    );
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

  it('rejects non-IANA timezones at the fixture and fixture-date boundary', async () => {
    await expect(
      handleRuntimeMessage({
        type: 'GET_FIXTURES',
        payload: {
          leagueUid: 'league-1',
          date: '2026-08-11',
          mode: 'nearest',
          timezone: 'UTC+9',
        },
      }),
    ).resolves.toEqual({
      ok: false,
      error: 'Invalid Footballay API request',
    });
    await expect(
      handleRuntimeMessage({
        type: 'GET_FIXTURE_DATES',
        payload: {
          leagueUid: 'league-1',
          startDate: '2026-08-01',
          endDate: '2026-08-31',
          timezone: 'Asia/NotExists',
        },
      }),
    ).resolves.toEqual({
      ok: false,
      error: 'Invalid Footballay API request',
    });
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
        payload: { fixtureUid: 'fixture-1', localeOverride: 'ko' },
      }),
    ).resolves.toEqual({
      ok: false,
      error: 'Invalid Footballay API request',
    });
    await expect(
      handleRuntimeMessage({
        type: 'GET_FIXTURE_DATES',
        payload: {
          leagueUid: 'league-1',
          startDate: '2026-08-01',
          endDate: '2026-08-31',
          timezone: 'Asia/Seoul',
          localeOverride: 'ko',
        },
      }),
    ).resolves.toEqual({
      ok: false,
      error: 'Invalid Footballay API request',
    });
  });

  it('prefers the current tab restore state and falls back to the last Coupang Play selection', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-03T00:00:00Z'));
    const local = new Map<string, unknown>();
    const session = new Map<string, unknown>();
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: local.get(key) })),
          set: vi.fn(async (items: Record<string, unknown>) => {
            Object.entries(items).forEach(([key, value]) =>
              local.set(key, value),
            );
          }),
        },
        session: {
          get: vi.fn(async (key: string) => ({ [key]: session.get(key) })),
          set: vi.fn(async (items: Record<string, unknown>) => {
            Object.entries(items).forEach(([key, value]) =>
              session.set(key, value),
            );
          }),
        },
      },
    });
    const tabA = coupangSender(1);
    const tabB = coupangSender(2);
    const tabC = coupangSender(3);
    const stateA = {
      leagueUid: 'league-a',
      selectedDate: '2026-09-02',
      fixtureUid: 'fixture-a',
      updatedAt: Date.now(),
    };
    const stateB = {
      leagueUid: 'league-b',
      selectedDate: '2026-09-03',
      fixtureUid: 'fixture-b',
      updatedAt: Date.now(),
    };

    await handleRuntimeMessage(
      { type: 'SAVE_RESTORE_STATE', payload: stateA },
      tabA,
    );
    await handleRuntimeMessage(
      { type: 'SAVE_RESTORE_STATE', payload: stateB },
      tabB,
    );

    await expect(
      handleRuntimeMessage({ type: 'LOAD_RESTORE_STATE' }, tabA),
    ).resolves.toEqual({ ok: true, data: stateA });
    await expect(
      handleRuntimeMessage({ type: 'LOAD_RESTORE_STATE' }, tabC),
    ).resolves.toEqual({ ok: true, data: stateB });
    expect(session.get('footballay-restore-tab:3')).toEqual(stateB);
  });

  it('does not restore selections older than four hours', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-03T00:00:00Z'));
    const expired = {
      leagueUid: 'league-1',
      selectedDate: '2026-09-02',
      fixtureUid: 'fixture-1',
      updatedAt: Date.now() - 4 * 60 * 60 * 1_000 - 1,
    };
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn(async () => ({ 'footballay-restore-state': expired })),
        },
        session: {
          get: vi.fn(async () => ({ 'footballay-restore-tab:1': expired })),
          set: vi.fn(),
        },
      },
    });

    await expect(
      handleRuntimeMessage({ type: 'LOAD_RESTORE_STATE' }, coupangSender(1)),
    ).resolves.toEqual({ ok: true, data: undefined });
  });
});
