import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FixtureDto } from '@/shared/api/dto';

const requestAvailableLeagues = vi.hoisted(() => vi.fn());
const requestFixtures = vi.hoisted(() => vi.fn());
const requestFixtureDates = vi.hoisted(() => vi.fn());
const matchData = vi.hoisted(() => ({
  activateFixture: vi.fn(),
  updateFixtureInfo: vi.fn(),
  clearFixture: vi.fn(),
}));
const settings = vi.hoisted(() => {
  let value = { locale: 'default', timezone: 'default' };
  return {
    getSettings: () => value,
    set(next: typeof value) {
      value = next;
    },
  };
});

vi.mock('@/shared/api/client', () => ({
  requestAvailableLeagues,
  requestFixtures,
  requestFixtureDates,
}));
vi.mock('@/content/features/match-data', () => ({ matchData }));
vi.mock('@/content/features/settings', () => ({
  getSettings: settings.getSettings,
}));

import { fixtureSelectionManager } from './fixtureSelectionManager';
import { fixtureSelectionStore } from './fixtureSelectionStore';

function fixture(uid: string, kickoff: string | null = null): FixtureDto {
  return {
    uid,
    kickoff,
    round: 'Regular Season',
    homeTeam: null,
    awayTeam: null,
    status: { longStatus: 'Not Started', shortStatus: 'NS', elapsed: null },
    score: { home: null, away: null },
    available: true,
  };
}

describe('FixtureSelectionManager', () => {
  beforeEach(() => {
    fixtureSelectionManager.dispose();
    requestAvailableLeagues.mockReset();
    requestFixtures.mockReset();
    requestFixtureDates.mockReset();
    matchData.activateFixture.mockReset();
    matchData.updateFixtureInfo.mockReset();
    matchData.clearFixture.mockReset();
    settings.set({ locale: 'default', timezone: 'default' });
  });

  it('uses the required modes, timezone dates, and calendar range', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-28T23:30:00Z'));
    settings.set({ locale: 'ko', timezone: 'Asia/Seoul' });
    requestFixtures.mockResolvedValue({ ok: true, data: [] });
    requestFixtureDates.mockResolvedValue({
      ok: true,
      data: ['2026-08-22'],
    });

    await fixtureSelectionManager.selectLeague('league-1');
    await fixtureSelectionManager.navigateDate('previous');
    await fixtureSelectionManager.navigateDate('next');
    await fixtureSelectionManager.selectDate('2026-08-20');
    await fixtureSelectionManager.loadFixtureDates('2026-08-22');

    expect(requestFixtures).toHaveBeenNthCalledWith(1, {
      leagueUid: 'league-1',
      date: '2026-08-29',
      mode: 'nearest',
      timezone: 'Asia/Seoul',
      localeOverride: 'ko',
    });
    expect(requestFixtures).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ date: '2026-08-28', mode: 'previous' }),
    );
    expect(requestFixtures).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ date: '2026-08-29', mode: 'nearest' }),
    );
    expect(requestFixtures).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({ date: '2026-08-20', mode: 'exact' }),
    );
    expect(requestFixtureDates).toHaveBeenCalledWith({
      leagueUid: 'league-1',
      startDate: '2026-07-26',
      endDate: '2026-09-05',
      timezone: 'Asia/Seoul',
    });
    expect(matchData.clearFixture).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('ignores stale league, fixture, and fixture-date responses', async () => {
    let resolveOldLeague!: (value: unknown) => void;
    let resolveOldFixture!: (value: unknown) => void;
    let resolveOldDates!: (value: unknown) => void;
    requestAvailableLeagues
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOldLeague = resolve;
        }),
      )
      .mockResolvedValueOnce({
        ok: true,
        data: [{ uid: 'league-new', name: 'New', shortName: null, logo: null }],
      });

    const oldLeague = fixtureSelectionManager.loadAvailableLeagues();
    await fixtureSelectionManager.loadAvailableLeagues();
    resolveOldLeague({
      ok: true,
      data: [{ uid: 'league-old', name: 'Old', shortName: null, logo: null }],
    });
    await oldLeague;

    requestFixtures
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOldFixture = resolve;
        }),
      )
      .mockResolvedValueOnce({ ok: true, data: [fixture('fixture-new')] });
    const oldFixture = fixtureSelectionManager.selectLeague('league-old');
    await fixtureSelectionManager.selectLeague('league-new');
    resolveOldFixture({ ok: true, data: [fixture('fixture-old')] });
    await oldFixture;

    fixtureSelectionStore.setState({ selectedLeagueUid: 'league-new' });
    requestFixtureDates
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOldDates = resolve;
        }),
      )
      .mockResolvedValueOnce({ ok: true, data: ['2026-09-01'] });
    const oldDates = fixtureSelectionManager.loadFixtureDates('2026-08-01');
    await fixtureSelectionManager.loadFixtureDates('2026-09-01');
    resolveOldDates({ ok: true, data: ['2026-08-01'] });
    await oldDates;

    expect(fixtureSelectionStore.getState()).toMatchObject({
      leagues: [expect.objectContaining({ uid: 'league-new' })],
      selectedLeagueUid: 'league-new',
      fixtures: [expect.objectContaining({ uid: 'fixture-new' })],
      fixtureDates: ['2026-09-01'],
    });
  });

  it('connects fixture selection directly and preserves same-fixture data', () => {
    const first = fixture('fixture-1');
    const updated = { ...first, round: 'Updated' };
    fixtureSelectionStore.setState({ fixtures: [first] });

    fixtureSelectionManager.selectFixture(first.uid);
    fixtureSelectionStore.setState({ fixtures: [updated] });
    fixtureSelectionManager.selectFixture(first.uid);

    expect(matchData.activateFixture).toHaveBeenCalledOnce();
    expect(matchData.activateFixture).toHaveBeenCalledWith(first);
    expect(matchData.updateFixtureInfo).toHaveBeenCalledWith(updated);
  });

  it('updates or clears the selected fixture after a timezone reload', async () => {
    const current = fixture('fixture-1');
    const updated = { ...current, round: 'Localized' };
    settings.set({ locale: 'default', timezone: 'America/New_York' });
    fixtureSelectionStore.setState({
      selectedLeagueUid: 'league-1',
      selectedDate: '2026-08-28',
      selectedFixtureUid: current.uid,
    });
    requestFixtures.mockResolvedValueOnce({ ok: true, data: [updated] });

    await fixtureSelectionManager.reloadForSettings({
      localeChanged: false,
      timezoneChanged: true,
    });

    expect(requestFixtures).toHaveBeenCalledWith({
      leagueUid: 'league-1',
      date: '2026-08-28',
      mode: 'exact',
      timezone: 'America/New_York',
    });
    expect(matchData.updateFixtureInfo).toHaveBeenCalledWith(updated);
    expect(fixtureSelectionStore.getState().selectedFixtureUid).toBe(
      current.uid,
    );

    fixtureSelectionStore.setState({ selectedFixtureUid: current.uid });
    requestFixtures.mockResolvedValueOnce({ ok: true, data: [] });
    await fixtureSelectionManager.reloadForSettings({
      localeChanged: false,
      timezoneChanged: true,
    });

    expect(fixtureSelectionStore.getState().selectedFixtureUid).toBeUndefined();
    expect(matchData.clearFixture).toHaveBeenCalledOnce();
  });
});
