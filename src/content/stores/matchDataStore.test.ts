import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestFixtureStatus = vi.hoisted(() => vi.fn());
const requestFixtureLineup = vi.hoisted(() => vi.fn());
const requestFixtureEvents = vi.hoisted(() => vi.fn());
const requestFixtureStatistics = vi.hoisted(() => vi.fn());
vi.mock('@/shared/footballayApiProtocol', () => ({
  requestFixtureStatus,
  requestFixtureLineup,
  requestFixtureEvents,
  requestFixtureStatistics,
}));

import { setMatchDataFixture, useMatchDataStore } from './matchDataStore';

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
      status: 'ready',
      etags: { status: 's2', lineup: 'l2', events: 'e2', statistics: 't1' },
      statusData: { liveStatus: { shortStatus: '1H', score: { home: 1 } } },
      events: { events: [{ sequence: 1 }] },
      statistics: {},
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
    expect(useMatchDataStore.getState().statusData).toBeUndefined();
  });
});
