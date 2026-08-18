// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentApp } from './ContentApp';
import { useMatchDataStore } from './stores/matchDataStore';
import { useMatchPickerStore } from './stores/matchPickerStore';

const loadAvailableLeagues = vi.fn(async () => undefined);
const selectLeagueAndLoadFixtures = vi.fn(async (leagueUid: string) => {
  useMatchPickerStore.setState({
    selectedLeagueUid: leagueUid,
    fixtureStatus: 'ready',
    fixtures: [
      {
        uid: 'fixture-1',
        kickoff: '2026-08-11T12:00:00.000Z',
        homeTeam: { name: 'Home', nameKo: '홈' },
        awayTeam: { name: 'Away', nameKo: '원정' },
        status: { shortStatus: 'NS' },
        score: { home: 1, away: 0 },
      },
    ],
  });
});
const selectDateAndLoadFixtures = vi.fn(async (date: string) => {
  useMatchPickerStore.setState({ selectedDate: date, fixtureStatus: 'ready' });
});

afterEach(cleanup);

beforeEach(() => {
  loadAvailableLeagues.mockClear();
  selectLeagueAndLoadFixtures.mockClear();
  selectDateAndLoadFixtures.mockClear();
  useMatchPickerStore.setState({
    leagues: [
      { uid: 'league-1', name: 'Premier League', nameKo: '프리미어리그' },
      { uid: 'league-2', name: 'La Liga' },
    ],
    leagueStatus: 'ready',
    leagueError: undefined,
    fixtures: [],
    fixtureDates: ['2026-08-22'],
    fixtureStatus: 'idle',
    fixtureError: undefined,
    selectedLeagueUid: 'league-1',
    selectedDate: '2026-08-11',
    selectedFixtureUid: undefined,
    loadAvailableLeagues,
    selectLeagueAndLoadFixtures,
    selectDateAndLoadFixtures,
  });
  useMatchDataStore.setState({
    lineup: {
      fixtureUid: 'fixture-1',
      lineup: {
        home: {
          teamUid: 'home-team',
          teamName: 'Home',
          teamKoreanName: '홈',
          formation: '4-2-3-1',
          players: [
            {
              matchPlayerUid: 'home-player-1',
              playerUid: null,
              name: 'Home Player',
              koreanName: null,
              number: 1,
              photo: null,
              position: null,
              grid: null,
              substitute: false,
            },
          ],
          substitutes: [],
          playerColor: null,
        },
        away: {
          teamUid: 'away-team',
          teamName: 'Away',
          teamKoreanName: '원정',
          formation: '4-3-3',
          players: [
            {
              matchPlayerUid: 'away-player-2',
              playerUid: null,
              name: 'Away Player',
              koreanName: null,
              number: 2,
              photo: null,
              position: null,
              grid: null,
              substitute: false,
            },
          ],
          substitutes: [],
          playerColor: null,
        },
      },
    },
    statistics: {
      fixture: { uid: 'fixture-1', elapsed: 45, status: 'HT' },
      home: {
        team: {
          teamUid: 'home-team',
          name: 'Home',
          koreanName: '홈',
          logo: null,
          playerColor: null,
        },
        teamStatistics: {
          shotsOnGoal: 4,
          shotsOffGoal: 3,
          totalShots: 10,
          blockedShots: 3,
          shotsInsideBox: 6,
          shotsOutsideBox: 4,
          fouls: 7,
          cornerKicks: 3,
          offsides: 0,
          ballPossession: 55,
          yellowCards: 0,
          redCards: 0,
          goalkeeperSaves: 1,
          totalPasses: 100,
          passesAccurate: 80,
          passesAccuracyPercentage: 80,
          goalsPrevented: 0,
          xg: [{ elapsed: 45, xg: '1.4' }],
        },
        playerStatistics: [],
      },
      away: {
        team: {
          teamUid: 'away-team',
          name: 'Away',
          koreanName: '원정',
          logo: null,
          playerColor: null,
        },
        teamStatistics: {
          shotsOnGoal: 2,
          shotsOffGoal: 4,
          totalShots: 8,
          blockedShots: 2,
          shotsInsideBox: 4,
          shotsOutsideBox: 4,
          fouls: 5,
          cornerKicks: 1,
          offsides: 0,
          ballPossession: 45,
          yellowCards: 0,
          redCards: 0,
          goalkeeperSaves: 2,
          totalPasses: 90,
          passesAccurate: 70,
          passesAccuracyPercentage: 78,
          goalsPrevented: 0,
          xg: [{ elapsed: 45, xg: '0.9' }],
        },
        playerStatistics: [],
      },
    },
    events: { fixtureUid: 'fixture-1', events: [] },
  });
});

describe('ContentApp', () => {
  it('loads fixtures from a clicked league and keeps a clicked fixture selection in memory', async () => {
    const user = userEvent.setup();
    render(<ContentApp />);

    expect(
      screen
        .getByRole('button', { name: '프리미어리그' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
    await user.click(screen.getByRole('button', { name: 'La Liga' }));
    expect(selectLeagueAndLoadFixtures).toHaveBeenCalledWith('league-2');
    expect(screen.getByRole('button', { name: /21:00홈원정/ })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /21:00홈원정/ }));
    expect(useMatchPickerStore.getState().selectedFixtureUid).toBe('fixture-1');
  });

  it('collapses and expands the match selector', async () => {
    const user = userEvent.setup();
    render(<ContentApp />);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(
      screen.getByRole('button', { name: 'Open match selector' }),
    ).toBeTruthy();
    await user.click(
      screen.getByRole('button', { name: 'Open match selector' }),
    );
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });

  it('selects a calendar date and returns to the match tab', async () => {
    const user = userEvent.setup();
    render(<ContentApp />);

    await user.click(
      screen.getByRole('button', { name: 'Fixture date picker' }),
    );
    await user.click(screen.getByRole('button', { name: '22' }));

    expect(selectDateAndLoadFixtures).toHaveBeenCalledWith('2026-08-22');
    expect(screen.getByRole('region', { name: 'Fixtures' })).toBeTruthy();
  });

  it('moves the date picker by month without changing the fixture date', async () => {
    const user = userEvent.setup();
    render(<ContentApp />);

    await user.click(
      screen.getByRole('button', { name: 'Fixture date picker' }),
    );
    await user.click(screen.getByRole('button', { name: 'Previous month' }));

    expect(screen.getByText('2026. 07')).toBeTruthy();
    expect(useMatchPickerStore.getState().selectedDate).toBe('2026-08-11');
  });

  it('guides users to choose a league and disables date controls without one', async () => {
    const user = userEvent.setup();
    useMatchPickerStore.setState({ selectedLeagueUid: undefined });
    render(<ContentApp />);

    await user.click(screen.getByRole('button', { name: 'Match' }));

    expect(screen.getByText('리그를 선택해주세요.')).toBeTruthy();
    expect(
      screen
        .getByRole('button', { name: 'Previous fixture date' })
        .getAttribute('disabled'),
    ).toBe('');
    expect(
      screen
        .getByRole('button', { name: 'Fixture date picker' })
        .getAttribute('disabled'),
    ).toBe('');
    expect(
      screen
        .getByRole('button', { name: 'Next fixture date' })
        .getAttribute('disabled'),
    ).toBe('');
  });

  it('switches match-panel tabs and its lineup team for a selected fixture', async () => {
    const user = userEvent.setup();
    useMatchPickerStore.setState({ selectedFixtureUid: 'fixture-1' });
    render(<ContentApp />);

    expect(
      screen.getByRole('tab', { name: 'Lineup' }).getAttribute('aria-selected'),
    ).toBe('true');
    expect(screen.getByText('Home Player')).toBeTruthy();
    await user.click(screen.getByRole('tab', { name: '원정' }));
    expect(screen.getByText('Away Player')).toBeTruthy();
    await user.click(screen.getByRole('tab', { name: 'Statistics' }));
    expect(
      screen
        .getByRole('tab', { name: 'Statistics' })
        .getAttribute('aria-selected'),
    ).toBe('true');
    expect(screen.getByText('Possession')).toBeTruthy();
  });

  it('shows an empty state when only one team has statistics', async () => {
    const user = userEvent.setup();
    useMatchPickerStore.setState({ selectedFixtureUid: 'fixture-1' });
    useMatchDataStore.setState((state) => ({
      statistics: state.statistics
        ? { ...state.statistics, away: null }
        : undefined,
    }));
    render(<ContentApp />);

    await user.click(screen.getByRole('tab', { name: 'Statistics' }));
    expect(screen.getByText('통계 데이터가 없습니다.')).toBeTruthy();
  });

  it('hides possession when the statistic is unavailable', async () => {
    const user = userEvent.setup();
    useMatchPickerStore.setState({ selectedFixtureUid: 'fixture-1' });
    useMatchDataStore.setState((state) => ({
      statistics:
        state.statistics && state.statistics.home
          ? {
              ...state.statistics,
              home: {
                ...state.statistics.home,
                teamStatistics: {
                  ...state.statistics.home.teamStatistics,
                  ballPossession: undefined as never,
                },
              },
            }
          : state.statistics,
    }));
    render(<ContentApp />);

    await user.click(screen.getByRole('tab', { name: 'Statistics' }));
    expect(screen.queryByText('Possession')).toBeNull();
  });

  it('normalizes team colors and keeps statistic bar ratios', async () => {
    const user = userEvent.setup();
    useMatchPickerStore.setState({ selectedFixtureUid: 'fixture-1' });
    useMatchDataStore.setState((state) => ({
      statistics:
        state.statistics && state.statistics.home && state.statistics.away
          ? {
              ...state.statistics,
              home: {
                ...state.statistics.home,
                team: {
                  ...state.statistics.home.team,
                  playerColor: {
                    primary: 'abd1f5',
                    number: '000000',
                    border: null,
                  },
                },
              },
              away: {
                ...state.statistics.away,
                team: {
                  ...state.statistics.away.team,
                  playerColor: {
                    primary: '7000ff',
                    number: 'ffffff',
                    border: null,
                  },
                },
              },
            }
          : state.statistics,
    }));
    render(<ContentApp />);

    await user.click(screen.getByRole('tab', { name: 'Statistics' }));
    const possession = screen.getByText('Possession').parentElement!;
    expect(possession.querySelector('b')?.style.background).toBe(
      'rgb(171, 209, 245)',
    );
    expect(possession.querySelector('b')?.style.flex).toBe('0 0 55%');
    expect(possession.querySelector('em')?.style.flex).toBe('0 0 45%');
  });
});
