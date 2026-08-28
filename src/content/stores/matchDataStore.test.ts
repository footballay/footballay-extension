import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestFixtureStatus = vi.hoisted(() => vi.fn());
const requestFixtureLineup = vi.hoisted(() => vi.fn());
const requestFixtureEvents = vi.hoisted(() => vi.fn());
const requestFixtureStatistics = vi.hoisted(() => vi.fn());
const settings = vi.hoisted(() => {
  let value: { locale: 'default' | 'ko' | 'en'; timezone: string } = {
    locale: 'default',
    timezone: 'default',
  };
  return {
    getState: () => ({ settings: value }),
    setState: ({ settings: next }: { settings?: typeof value }) => {
      if (next) value = next;
    },
  };
});
vi.mock('@/shared/api/client', () => ({
  requestFixtureStatus,
  requestFixtureLineup,
  requestFixtureEvents,
  requestFixtureStatistics,
}));
vi.mock('@/content/stores/settingsStore', () => ({
  useSettingsStore: settings,
}));

import { setMatchDataFixture, useMatchDataStore } from './matchDataStore';
import {
  createFixtureLineup,
  createFixtureStatistics,
} from '@/content/test/matchDataFixtures';

const updated = <T>(data: T, etag: string) => ({
  ok: true as const,
  data: { type: 'updated' as const, data, etag },
});

describe('match data store', () => {
  beforeEach(() => {
    requestFixtureStatus.mockReset();
    requestFixtureLineup.mockReset();
    requestFixtureEvents.mockReset();
    requestFixtureStatistics.mockReset();
    settings.setState({
      settings: { locale: 'default', timezone: 'default' },
    });
    setMatchDataFixture();
  });

  it('loads four endpoint payloads and refreshes each with its own ETag', async () => {
    requestFixtureStatus
      .mockResolvedValueOnce(
        updated(
          { liveStatus: { shortStatus: '1H', score: { home: 1 } } },
          's1',
        ),
      )
      .mockResolvedValueOnce({
        ok: true,
        data: { type: 'not-modified', etag: 's2' },
      });
    requestFixtureLineup
      .mockResolvedValueOnce(updated({ lineup: {} }, 'l1'))
      .mockResolvedValueOnce({
        ok: true,
        data: { type: 'not-modified', etag: 'l2' },
      });
    requestFixtureEvents
      .mockResolvedValueOnce(updated({ events: [] }, 'e1'))
      .mockResolvedValueOnce(updated({ events: [{ sequence: 1 }] }, 'e2'));
    requestFixtureStatistics
      .mockResolvedValueOnce(updated({}, 't1'))
      .mockResolvedValueOnce({ ok: false, error: 'temporary failure' });

    setMatchDataFixture('fixture-1');
    await useMatchDataStore.getState().refreshMatchData();
    await useMatchDataStore.getState().refreshMatchData();

    expect(requestFixtureStatus).toHaveBeenLastCalledWith({
      fixtureUid: 'fixture-1',
      etag: 's1',
    });
    expect(requestFixtureEvents).toHaveBeenLastCalledWith({
      fixtureUid: 'fixture-1',
      etag: 'e1',
    });
    expect(useMatchDataStore.getState()).toMatchObject({
      fixtureUid: 'fixture-1',
      status: {
        loadStatus: 'ready',
        etag: 's2',
        data: { liveStatus: { shortStatus: '1H', score: { home: 1 } } },
      },
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

  it('keeps endpoint failures isolated from successful resources', async () => {
    requestFixtureStatus.mockResolvedValue(
      updated({ liveStatus: { shortStatus: '1H', score: {} } }, 's1'),
    );
    requestFixtureLineup.mockResolvedValue({
      ok: false,
      error: 'lineup failed',
    });
    requestFixtureEvents.mockResolvedValue(updated({ events: [] }, 'e1'));
    requestFixtureStatistics.mockResolvedValue(updated({}, 't1'));

    setMatchDataFixture('fixture-1');
    await useMatchDataStore.getState().refreshMatchData();

    expect(useMatchDataStore.getState()).toMatchObject({
      lineup: { loadStatus: 'error', error: 'lineup failed' },
      status: { loadStatus: 'ready', etag: 's1' },
      events: { loadStatus: 'ready', etag: 'e1' },
      statistics: { loadStatus: 'ready', etag: 't1' },
    });
  });

  it('adds locale only to localized match-data requests', async () => {
    requestFixtureStatus.mockResolvedValue({
      ok: true,
      data: { type: 'not-modified' },
    });
    requestFixtureLineup.mockResolvedValue({
      ok: true,
      data: { type: 'not-modified' },
    });
    requestFixtureEvents.mockResolvedValue({
      ok: true,
      data: { type: 'not-modified' },
    });
    requestFixtureStatistics.mockResolvedValue({
      ok: true,
      data: { type: 'not-modified' },
    });
    settings.setState({
      settings: { locale: 'en', timezone: 'default' },
    });

    setMatchDataFixture('fixture-1');
    await useMatchDataStore.getState().refreshMatchData();

    expect(requestFixtureStatus).toHaveBeenCalledWith({
      fixtureUid: 'fixture-1',
      etag: undefined,
    });
    expect(requestFixtureLineup).toHaveBeenCalledWith(
      expect.objectContaining({ localeOverride: 'en' }),
    );
    expect(requestFixtureEvents).toHaveBeenCalledWith(
      expect.objectContaining({ localeOverride: 'en' }),
    );
    expect(requestFixtureStatistics).toHaveBeenCalledWith(
      expect.objectContaining({ localeOverride: 'en' }),
    );
  });

  it('reloads only localized resources without their previous ETags', async () => {
    requestFixtureLineup.mockResolvedValue(
      updated(createFixtureLineup({ fixtureUid: 'en' }), 'l2'),
    );
    requestFixtureEvents.mockResolvedValue(
      updated({ fixtureUid: 'en', events: [] }, 'e2'),
    );
    requestFixtureStatistics.mockResolvedValue(
      updated(createFixtureStatistics(), 't2'),
    );
    settings.setState({
      settings: { locale: 'en', timezone: 'default' },
    });
    setMatchDataFixture('fixture-1');
    useMatchDataStore.setState({
      status: {
        loadStatus: 'ready',
        data: {
          fixtureUid: 'fixture-1',
          liveStatus: {
            elapsed: null,
            shortStatus: 'NS',
            longStatus: 'Not Started',
            score: { home: null, away: null },
          },
        },
        etag: 's1',
      },
      lineup: {
        loadStatus: 'ready',
        data: createFixtureLineup({ fixtureUid: 'ko' }),
        etag: 'l1',
      },
      events: {
        loadStatus: 'ready',
        data: { fixtureUid: 'ko', events: [] },
        etag: 'e1',
      },
      statistics: {
        loadStatus: 'ready',
        data: createFixtureStatistics(),
        etag: 't1',
      },
    });

    await useMatchDataStore.getState().reloadLocalizedMatchData();

    expect(requestFixtureStatus).not.toHaveBeenCalled();
    expect(requestFixtureLineup).toHaveBeenCalledWith({
      fixtureUid: 'fixture-1',
      localeOverride: 'en',
    });
    expect(requestFixtureEvents).toHaveBeenCalledWith({
      fixtureUid: 'fixture-1',
      localeOverride: 'en',
    });
    expect(requestFixtureStatistics).toHaveBeenCalledWith({
      fixtureUid: 'fixture-1',
      localeOverride: 'en',
    });
    expect(useMatchDataStore.getState()).toMatchObject({
      status: { loadStatus: 'ready', etag: 's1' },
      lineup: { loadStatus: 'ready', data: { fixtureUid: 'en' }, etag: 'l2' },
    });
  });

  it('ignores a late localized response after the locale changes again', async () => {
    let resolveOldLineup!: (value: unknown) => void;
    requestFixtureLineup
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOldLineup = resolve;
        }),
      )
      .mockResolvedValueOnce(
        updated(createFixtureLineup({ fixtureUid: 'en' }), 'l2'),
      );
    requestFixtureEvents.mockResolvedValue(
      updated({ fixtureUid: 'en', events: [] }, 'e2'),
    );
    requestFixtureStatistics.mockResolvedValue(
      updated(createFixtureStatistics(), 't2'),
    );
    setMatchDataFixture('fixture-1');
    settings.setState({ settings: { locale: 'ko', timezone: 'default' } });
    const oldReload = useMatchDataStore.getState().reloadLocalizedMatchData();

    settings.setState({ settings: { locale: 'en', timezone: 'default' } });
    await useMatchDataStore.getState().reloadLocalizedMatchData();
    resolveOldLineup(updated(createFixtureLineup({ fixtureUid: 'ko' }), 'l1'));
    await oldReload;

    expect(useMatchDataStore.getState().lineup).toMatchObject({
      data: { fixtureUid: 'en' },
      etag: 'l2',
    });
  });

  it('ignores a response after another fixture is selected', async () => {
    let resolveStatus!: (value: unknown) => void;
    requestFixtureStatus
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveStatus = resolve;
        }),
      )
      .mockResolvedValue({ ok: true, data: { type: 'not-modified' } });
    requestFixtureLineup.mockResolvedValue({
      ok: true,
      data: { type: 'not-modified' },
    });
    requestFixtureEvents.mockResolvedValue({
      ok: true,
      data: { type: 'not-modified' },
    });
    requestFixtureStatistics.mockResolvedValue({
      ok: true,
      data: { type: 'not-modified' },
    });

    setMatchDataFixture('fixture-old');
    const oldRefresh = useMatchDataStore.getState().refreshMatchData();
    setMatchDataFixture('fixture-1');
    await useMatchDataStore.getState().refreshMatchData();
    resolveStatus(
      updated({ liveStatus: { shortStatus: '1H', score: {} } }, 'old-status'),
    );
    await oldRefresh;

    expect(useMatchDataStore.getState().fixtureUid).toBe('fixture-1');
    expect(useMatchDataStore.getState().status.data).toBeUndefined();
  });
});
