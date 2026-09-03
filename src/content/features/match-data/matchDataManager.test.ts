// @vitest-environment jsdom

import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FixtureDto } from '@/shared/api/dto';

const requestFixtureStatus = vi.hoisted(() => vi.fn());
const requestFixtureLineup = vi.hoisted(() => vi.fn());
const requestFixtureEvents = vi.hoisted(() => vi.fn());
const requestFixtureStatistics = vi.hoisted(() => vi.fn());
const settings = vi.hoisted(() => {
  let value = { enabled: true, locale: 'default', timezone: 'default' };
  return {
    getSettings: () => value,
    set(next: typeof value) {
      value = next;
    },
  };
});

vi.mock('@/shared/api/client', () => ({
  requestFixtureStatus,
  requestFixtureLineup,
  requestFixtureEvents,
  requestFixtureStatistics,
}));
vi.mock('@/content/features/settings', () => ({
  getSettings: settings.getSettings,
}));

import { matchDataManager } from './matchDataManager';
import { createMatchDataState, matchDataStore } from './matchDataStore';

function fixture(uid: string, round = 'Regular Season'): FixtureDto {
  return {
    uid,
    kickoff: null,
    round,
    homeTeam: null,
    awayTeam: null,
    status: { longStatus: 'Not Started', shortStatus: 'NS', elapsed: null },
    score: { home: null, away: null },
    available: true,
  };
}

const updated = <T>(data: T, etag: string) => ({
  ok: true as const,
  data: { type: 'updated' as const, data, etag },
});

const notModified = (etag?: string) => ({
  ok: true as const,
  data: { type: 'not-modified' as const, etag },
});

describe('MatchDataManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    matchDataManager.dispose();
    requestFixtureStatus.mockReset();
    requestFixtureLineup.mockReset();
    requestFixtureEvents.mockReset();
    requestFixtureStatistics.mockReset();
    settings.set({ enabled: true, locale: 'en', timezone: 'default' });
  });

  afterEach(() => {
    matchDataManager.dispose();
    vi.useRealTimers();
  });

  it('refreshes four endpoints with independent ETags and failures', async () => {
    requestFixtureStatus
      .mockResolvedValueOnce(
        updated({ liveStatus: { shortStatus: '1H' } }, 's1'),
      )
      .mockResolvedValueOnce(notModified('s2'));
    requestFixtureLineup
      .mockResolvedValueOnce(updated({ lineup: {} }, 'l1'))
      .mockResolvedValueOnce(notModified('l2'));
    requestFixtureEvents
      .mockResolvedValueOnce(updated({ events: [] }, 'e1'))
      .mockResolvedValueOnce(updated({ events: [{ sequence: 1 }] }, 'e2'));
    requestFixtureStatistics
      .mockResolvedValueOnce(updated({}, 't1'))
      .mockResolvedValueOnce({ ok: false, error: 'temporary failure' });
    matchDataStore.setState(createMatchDataState(fixture('fixture-1')));

    await matchDataManager.refresh();
    await matchDataManager.refresh();

    expect(requestFixtureStatus).toHaveBeenLastCalledWith({
      fixtureUid: 'fixture-1',
      etag: 's1',
    });
    expect(requestFixtureLineup).toHaveBeenLastCalledWith({
      fixtureUid: 'fixture-1',
      etag: 'l1',
      localeOverride: 'en',
    });
    expect(requestFixtureEvents).toHaveBeenLastCalledWith({
      fixtureUid: 'fixture-1',
      etag: 'e1',
      localeOverride: 'en',
    });
    expect(matchDataStore.getState()).toMatchObject({
      status: { loadStatus: 'ready', etag: 's2' },
      lineup: { loadStatus: 'ready', etag: 'l2' },
      events: {
        loadStatus: 'ready',
        etag: 'e2',
        data: { events: [{ sequence: 1 }] },
      },
      statistics: {
        loadStatus: 'error',
        etag: 't1',
        error: 'temporary failure',
      },
    });
  });

  it('reloads localized data without ETags and ignores stale locale responses', async () => {
    let resolveOldLineup!: (value: unknown) => void;
    requestFixtureLineup
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOldLineup = resolve;
        }),
      )
      .mockResolvedValueOnce(updated({ fixtureUid: 'en', lineup: {} }, 'l2'));
    requestFixtureEvents.mockResolvedValue(updated({ events: [] }, 'e2'));
    requestFixtureStatistics.mockResolvedValue(updated({}, 't2'));
    matchDataStore.setState(createMatchDataState(fixture('fixture-1')));
    settings.set({ enabled: true, locale: 'ko', timezone: 'default' });

    const oldReload = matchDataManager.reloadLocalized();
    settings.set({ enabled: true, locale: 'en', timezone: 'default' });
    await matchDataManager.reloadLocalized();
    resolveOldLineup(updated({ fixtureUid: 'ko', lineup: {} }, 'l1'));
    await oldReload;

    expect(requestFixtureLineup).toHaveBeenNthCalledWith(1, {
      fixtureUid: 'fixture-1',
      localeOverride: 'ko',
    });
    expect(requestFixtureLineup).toHaveBeenNthCalledWith(2, {
      fixtureUid: 'fixture-1',
      localeOverride: 'en',
    });
    expect(matchDataStore.getState().lineup).toMatchObject({
      data: { fixtureUid: 'en' },
      etag: 'l2',
    });
  });

  it('polls immediately, pauses while hidden, resumes, and stops terminal status', async () => {
    requestFixtureStatus.mockResolvedValue(
      updated({ liveStatus: { shortStatus: '1H' } }, 's1'),
    );
    requestFixtureLineup.mockResolvedValue(notModified());
    requestFixtureEvents.mockResolvedValue(notModified());
    requestFixtureStatistics.mockResolvedValue(notModified());

    matchDataManager.activateFixture(fixture('fixture-1'));
    await act(async () => undefined);
    expect(requestFixtureStatus).toHaveBeenCalledTimes(1);

    await act(async () => vi.advanceTimersByTimeAsync(20_000));
    expect(requestFixtureStatus).toHaveBeenCalledTimes(2);

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    await act(async () => vi.advanceTimersByTimeAsync(20_000));
    expect(requestFixtureStatus).toHaveBeenCalledTimes(2);

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    await act(async () => undefined);
    expect(requestFixtureStatus).toHaveBeenCalledTimes(3);

    requestFixtureStatus.mockResolvedValue(
      updated({ liveStatus: { shortStatus: 'FT' } }, 's2'),
    );
    await act(async () => vi.advanceTimersByTimeAsync(20_000));
    await act(async () => vi.advanceTimersByTimeAsync(20_000));
    expect(requestFixtureStatus).toHaveBeenCalledTimes(4);
  });

  it('stops polling while disabled and resumes with the current fixture data', async () => {
    requestFixtureStatus.mockResolvedValue(
      updated({ liveStatus: { shortStatus: '1H' } }, 's1'),
    );
    requestFixtureLineup.mockResolvedValue(notModified());
    requestFixtureEvents.mockResolvedValue(notModified());
    requestFixtureStatistics.mockResolvedValue(notModified());

    matchDataManager.activateFixture(fixture('fixture-1'));
    await act(async () => undefined);
    matchDataStore.setState({
      events: {
        loadStatus: 'ready',
        data: { fixtureUid: 'fixture-1', events: [] },
        etag: 'e1',
      },
    });

    settings.set({ enabled: false, locale: 'en', timezone: 'default' });
    matchDataManager.setEnabled(false);
    await act(async () => vi.advanceTimersByTimeAsync(40_000));

    expect(requestFixtureStatus).toHaveBeenCalledOnce();
    expect(matchDataStore.getState()).toMatchObject({
      fixtureInfo: { uid: 'fixture-1' },
      events: { etag: 'e1' },
    });

    settings.set({ enabled: true, locale: 'en', timezone: 'default' });
    matchDataManager.setEnabled(true);
    await act(async () => undefined);

    expect(requestFixtureStatus).toHaveBeenCalledTimes(2);
  });

  it('does not poll an activated fixture until enabled', async () => {
    requestFixtureStatus.mockResolvedValue(notModified());
    requestFixtureLineup.mockResolvedValue(notModified());
    requestFixtureEvents.mockResolvedValue(notModified());
    requestFixtureStatistics.mockResolvedValue(notModified());
    settings.set({ enabled: false, locale: 'en', timezone: 'default' });

    matchDataManager.activateFixture(fixture('fixture-1'));
    await act(async () => vi.advanceTimersByTimeAsync(40_000));

    expect(requestFixtureStatus).not.toHaveBeenCalled();
    expect(matchDataStore.getState().fixtureInfo?.uid).toBe('fixture-1');

    settings.set({ enabled: true, locale: 'en', timezone: 'default' });
    matchDataManager.setEnabled(true);
    await act(async () => undefined);

    expect(requestFixtureStatus).toHaveBeenCalledOnce();
  });

  it('keeps same-fixture data and ignores an old fixture response after switching', async () => {
    let resolveOldStatus!: (value: unknown) => void;
    requestFixtureStatus
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOldStatus = resolve;
        }),
      )
      .mockResolvedValue(notModified());
    requestFixtureLineup.mockResolvedValue(notModified());
    requestFixtureEvents.mockResolvedValue(notModified());
    requestFixtureStatistics.mockResolvedValue(notModified());

    matchDataManager.activateFixture(fixture('fixture-old'));
    await act(async () => undefined);
    matchDataStore.setState({
      events: {
        loadStatus: 'ready',
        data: { fixtureUid: 'fixture-old', events: [] },
        etag: 'e1',
      },
    });
    matchDataManager.activateFixture(fixture('fixture-old', 'Updated'));

    expect(matchDataStore.getState()).toMatchObject({
      fixtureInfo: { uid: 'fixture-old', round: 'Updated' },
      events: { etag: 'e1' },
    });
    expect(requestFixtureStatus).toHaveBeenCalledTimes(1);

    matchDataManager.activateFixture(fixture('fixture-new'));
    await act(async () => undefined);
    resolveOldStatus(
      updated({ liveStatus: { shortStatus: 'FT' } }, 'old-status'),
    );
    await act(async () => undefined);

    expect(matchDataStore.getState().fixtureInfo?.uid).toBe('fixture-new');
    expect(matchDataStore.getState().status.etag).not.toBe('old-status');
  });
});
