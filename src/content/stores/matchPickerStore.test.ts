import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestAvailableLeagues = vi.hoisted(() => vi.fn());
const requestFixtures = vi.hoisted(() => vi.fn());
const requestFixtureDates = vi.hoisted(() => vi.fn());
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
  requestAvailableLeagues,
  requestFixtureDates,
  requestFixtures,
}));
vi.mock('@/content/stores/settingsStore', () => ({
  useSettingsStore: settings,
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
    settings.setState({
      settings: { locale: 'default', timezone: 'default' },
    });
  });

  it('loads raw league data', async () => {
    requestAvailableLeagues.mockResolvedValueOnce({
      ok: true,
      data: [
        {
          uid: 'league-1',
          name: '프리미어리그',
          shortName: 'PL',
          logo: 'logo.png',
        },
      ],
    });

    await useMatchPickerStore.getState().loadAvailableLeagues();

    expect(useMatchPickerStore.getState()).toMatchObject({
      leagues: [
        {
          uid: 'league-1',
          name: '프리미어리그',
          shortName: 'PL',
          logo: 'logo.png',
        },
      ],
      leagueStatus: 'ready',
    });
  });

  it('keeps the latest locale league response when an earlier request finishes late', async () => {
    let resolveOldRequest!: (value: unknown) => void;
    requestAvailableLeagues
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOldRequest = resolve;
        }),
      )
      .mockResolvedValueOnce({
        ok: true,
        data: [
          {
            uid: 'league-ko',
            name: '프리미어리그',
            shortName: 'PL',
            logo: null,
          },
        ],
      });

    const oldRequest = useMatchPickerStore.getState().loadAvailableLeagues();
    settings.setState({ settings: { locale: 'ko', timezone: 'default' } });
    await useMatchPickerStore.getState().loadAvailableLeagues();
    resolveOldRequest({
      ok: true,
      data: [
        {
          uid: 'league-default',
          name: 'Premier League',
          shortName: 'PL',
          logo: null,
        },
      ],
    });
    await oldRequest;

    expect(useMatchPickerStore.getState()).toMatchObject({
      leagues: [expect.objectContaining({ uid: 'league-ko' })],
      leagueStatus: 'ready',
    });
  });

  it('ignores a late league request error after a newer response succeeds', async () => {
    let rejectOldRequest!: (error: Error) => void;
    requestAvailableLeagues
      .mockReturnValueOnce(
        new Promise((_, reject) => {
          rejectOldRequest = reject;
        }),
      )
      .mockResolvedValueOnce({ ok: true, data: [] });

    const oldRequest = useMatchPickerStore.getState().loadAvailableLeagues();
    await useMatchPickerStore.getState().loadAvailableLeagues();
    rejectOldRequest(new Error('old request failed'));
    await oldRequest;

    expect(useMatchPickerStore.getState()).toMatchObject({
      leagues: [],
      leagueStatus: 'ready',
      leagueError: undefined,
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

  it('passes the saved locale and timezone to localized fixture requests', async () => {
    requestAvailableLeagues.mockResolvedValueOnce({ ok: true, data: [] });
    requestFixtures.mockResolvedValueOnce({ ok: true, data: [] });
    requestFixtureDates.mockResolvedValueOnce({ ok: true, data: [] });
    settings.setState({
      settings: { locale: 'ko', timezone: 'Asia/Seoul' },
    });

    await useMatchPickerStore.getState().loadAvailableLeagues();
    await useMatchPickerStore
      .getState()
      .selectLeagueAndLoadFixtures('league-1');
    await useMatchPickerStore.getState().loadFixtureDates('2026-08-22');

    expect(requestAvailableLeagues).toHaveBeenCalledWith({
      localeOverride: 'ko',
    });
    expect(requestFixtures).toHaveBeenCalledWith(
      expect.objectContaining({
        localeOverride: 'ko',
        timezone: 'Asia/Seoul',
      }),
    );
    expect(requestFixtureDates).toHaveBeenCalledWith(
      expect.objectContaining({ timezone: 'Asia/Seoul' }),
    );
    expect(requestFixtureDates.mock.calls[0]?.[0]).not.toHaveProperty(
      'localeOverride',
    );
  });

  it('uses the system timezone while the setting is default', async () => {
    requestFixtures.mockResolvedValueOnce({ ok: true, data: [] });

    await useMatchPickerStore
      .getState()
      .selectLeagueAndLoadFixtures('league-1');

    expect(requestFixtures).toHaveBeenCalledWith(
      expect.objectContaining({
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      }),
    );
  });

  it('uses selected-timezone today for the initial nearest request', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-28T23:30:00Z'));
    requestFixtures.mockResolvedValueOnce({ ok: true, data: [] });
    settings.setState({
      settings: { locale: 'default', timezone: 'Asia/Seoul' },
    });

    await useMatchPickerStore
      .getState()
      .selectLeagueAndLoadFixtures('league-1');

    expect(requestFixtures).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2026-08-29', mode: 'nearest' }),
    );
    vi.useRealTimers();
  });

  it('uses selected-timezone today when changing leagues', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-28T23:30:00Z'));
    requestFixtures.mockResolvedValueOnce({
      ok: true,
      data: [{ uid: 'fixture-1', kickoff: '2026-08-28T23:30:00Z' }],
    });
    settings.setState({
      settings: { locale: 'default', timezone: 'Asia/Seoul' },
    });
    useMatchPickerStore.setState({ selectedDate: '2026-01-01' });

    await useMatchPickerStore
      .getState()
      .selectLeagueAndLoadFixtures('league-2');

    expect(requestFixtures).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2026-08-29', mode: 'nearest' }),
    );
    expect(useMatchPickerStore.getState().selectedDate).toBe('2026-08-29');
    vi.useRealTimers();
  });

  it('uses the selected timezone for nearest and previous kickoff dates', async () => {
    requestFixtures
      .mockResolvedValueOnce({
        ok: true,
        data: [{ uid: 'fixture-1', kickoff: '2026-08-28T23:30:00Z' }],
      })
      .mockResolvedValueOnce({
        ok: true,
        data: [{ uid: 'fixture-2', kickoff: '2026-08-28T23:30:00Z' }],
      });
    settings.setState({
      settings: { locale: 'default', timezone: 'Asia/Seoul' },
    });

    await useMatchPickerStore
      .getState()
      .selectLeagueAndLoadFixtures('league-1');
    expect(useMatchPickerStore.getState().selectedDate).toBe('2026-08-29');

    settings.setState({
      settings: { locale: 'default', timezone: 'America/Los_Angeles' },
    });
    await useMatchPickerStore.getState().navigateFixtureDate('previous');

    expect(requestFixtures).toHaveBeenLastCalledWith(
      expect.objectContaining({ mode: 'previous', date: '2026-08-28' }),
    );
    expect(useMatchPickerStore.getState().selectedDate).toBe('2026-08-28');
  });

  it('keeps an exact request date even when kickoff crosses the selected timezone date', async () => {
    requestFixtures.mockResolvedValueOnce({
      ok: true,
      data: [{ uid: 'fixture-1', kickoff: '2026-08-28T23:30:00Z' }],
    });
    settings.setState({
      settings: { locale: 'default', timezone: 'Asia/Seoul' },
    });
    useMatchPickerStore.setState({ selectedLeagueUid: 'league-1' });

    await useMatchPickerStore
      .getState()
      .selectDateAndLoadFixtures('2026-08-28');

    expect(useMatchPickerStore.getState().selectedDate).toBe('2026-08-28');
  });

  it('reloads the same date exactly for a timezone change and preserves its fixture selection', async () => {
    requestFixtures.mockResolvedValueOnce({
      ok: true,
      data: [{ uid: 'fixture-1' }],
    });
    settings.setState({
      settings: { locale: 'default', timezone: 'America/New_York' },
    });
    useMatchPickerStore.setState({
      selectedLeagueUid: 'league-1',
      selectedDate: '2026-08-28',
      selectedFixtureUid: 'fixture-1',
    });

    await useMatchPickerStore.getState().reloadFixturesForTimezone();

    expect(requestFixtures).toHaveBeenCalledWith({
      leagueUid: 'league-1',
      date: '2026-08-28',
      mode: 'exact',
      timezone: 'America/New_York',
    });
    expect(useMatchPickerStore.getState()).toMatchObject({
      selectedLeagueUid: 'league-1',
      selectedDate: '2026-08-28',
      selectedFixtureUid: 'fixture-1',
    });
  });

  it('clears only a missing fixture selection after a timezone reload', async () => {
    requestFixtures.mockResolvedValueOnce({ ok: true, data: [] });
    useMatchPickerStore.setState({
      selectedLeagueUid: 'league-1',
      selectedDate: '2026-08-28',
      selectedFixtureUid: 'fixture-1',
    });

    await useMatchPickerStore.getState().reloadFixturesForTimezone();

    expect(useMatchPickerStore.getState()).toMatchObject({
      selectedLeagueUid: 'league-1',
      selectedDate: '2026-08-28',
      selectedFixtureUid: undefined,
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
