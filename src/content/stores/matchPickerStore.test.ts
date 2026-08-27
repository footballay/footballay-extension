import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestAvailableLeagues = vi.hoisted(() => vi.fn());
const requestFixtures = vi.hoisted(() => vi.fn());
const requestFixtureDates = vi.hoisted(() => vi.fn());
vi.mock('@/shared/api/client', () => ({
  requestAvailableLeagues,
  requestFixtureDates,
  requestFixtures,
}));

import { useMatchPickerStore } from './matchPickerStore';

describe('match picker store', () => {
  beforeEach(() => {
    requestAvailableLeagues.mockReset();
    requestFixtures.mockReset();
    requestFixtureDates.mockReset();
    useMatchPickerStore.setState({
      leagues: [],
      leagueStatus: 'idle',
      leagueError: undefined,
      fixtures: [],
      fixtureDates: [],
      fixtureStatus: 'idle',
      fixtureError: undefined,
      selectedLeagueUid: undefined,
      selectedDate: undefined,
      selectedFixtureUid: undefined,
    });
  });

  it('loads raw league data', async () => {
    requestAvailableLeagues.mockResolvedValueOnce({
      ok: true,
      data: [
        {
          uid: 'league-1',
          name: 'Premier League',
          nameKo: '프리미어리그',
          logo: 'logo.png',
        },
      ],
    });

    await useMatchPickerStore.getState().loadAvailableLeagues();

    expect(useMatchPickerStore.getState()).toMatchObject({
      leagues: [
        {
          uid: 'league-1',
          name: 'Premier League',
          nameKo: '프리미어리그',
          logo: 'logo.png',
        },
      ],
      leagueStatus: 'ready',
    });
  });

  it('selects a league and loads its fixtures in the same action flow', async () => {
    requestFixtures.mockResolvedValueOnce({
      ok: true,
      data: [
        {
          uid: 'fixture-1',
          status: { shortStatus: 'NS' },
          score: {},
        },
      ],
    });

    await useMatchPickerStore
      .getState()
      .selectLeagueAndLoadFixtures('league-1');
    useMatchPickerStore.getState().selectFixture('fixture-1');

    expect(requestFixtures).toHaveBeenCalledWith(
      expect.objectContaining({
        leagueUid: 'league-1',
        mode: 'nearest',
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        timezone: expect.any(String),
      }),
    );
    expect(useMatchPickerStore.getState()).toMatchObject({
      selectedLeagueUid: 'league-1',
      selectedFixtureUid: 'fixture-1',
      fixtureStatus: 'ready',
    });
  });

  it('makes a fixture API failure available to the view', async () => {
    requestFixtures.mockResolvedValueOnce({
      ok: false,
      error: 'Network unavailable',
    });

    await useMatchPickerStore
      .getState()
      .selectLeagueAndLoadFixtures('league-1');

    expect(useMatchPickerStore.getState()).toMatchObject({
      fixtureStatus: 'error',
      fixtureError: 'Network unavailable',
    });
  });

  it('uses archive-compatible modes for date navigation and direct selection', async () => {
    requestFixtures.mockResolvedValue({ ok: true, data: [] });
    useMatchPickerStore.setState({
      selectedLeagueUid: 'league-1',
      selectedDate: '2026-08-11',
      selectedFixtureUid: 'fixture-1',
    });

    await useMatchPickerStore.getState().navigateFixtureDate('previous');
    await useMatchPickerStore.getState().navigateFixtureDate('next');
    await useMatchPickerStore
      .getState()
      .selectDateAndLoadFixtures('2026-08-20');

    expect(requestFixtures).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        leagueUid: 'league-1',
        date: '2026-08-10',
        mode: 'previous',
      }),
    );
    expect(requestFixtures).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        leagueUid: 'league-1',
        date: '2026-08-11',
        mode: 'nearest',
      }),
    );
    expect(requestFixtures).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        leagueUid: 'league-1',
        date: '2026-08-20',
        mode: 'exact',
      }),
    );
    expect(useMatchPickerStore.getState().selectedFixtureUid).toBe('fixture-1');
  });

  it('loads fixture dates for the full Sunday-to-Saturday calendar grid', async () => {
    requestFixtureDates.mockResolvedValueOnce({
      ok: true,
      data: ['2026-08-22', '2026-08-23'],
    });
    useMatchPickerStore.setState({
      selectedLeagueUid: 'league-1',
      selectedDate: '2026-08-22',
    });

    await useMatchPickerStore.getState().loadFixtureDates('2026-08-22');

    expect(requestFixtureDates).toHaveBeenCalledWith(
      expect.objectContaining({
        leagueUid: 'league-1',
        startDate: '2026-07-26',
        endDate: '2026-09-05',
      }),
    );
    expect(useMatchPickerStore.getState().fixtureDates).toEqual([
      '2026-08-22',
      '2026-08-23',
    ]);
  });

  it('ignores a fixture response from an earlier league selection', async () => {
    let resolveFirstRequest!: (response: unknown) => void;
    const firstRequest = new Promise((resolve) => {
      resolveFirstRequest = resolve;
    });

    requestFixtures.mockReturnValueOnce(firstRequest).mockResolvedValueOnce({
      ok: true,
      data: [
        {
          uid: 'fixture-2',
          status: { shortStatus: 'NS' },
          score: {},
        },
      ],
    });

    const firstSelection = useMatchPickerStore
      .getState()
      .selectLeagueAndLoadFixtures('league-1');
    await useMatchPickerStore
      .getState()
      .selectLeagueAndLoadFixtures('league-2');
    resolveFirstRequest({
      ok: true,
      data: [
        {
          uid: 'fixture-1',
          status: { shortStatus: 'NS' },
          score: {},
        },
      ],
    });
    await firstSelection;

    expect(useMatchPickerStore.getState()).toMatchObject({
      selectedLeagueUid: 'league-2',
      fixtures: [expect.objectContaining({ uid: 'fixture-2' })],
    });
  });
});
