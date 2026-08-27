// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentApp } from './ContentApp';
import { useMatchDataStore } from './stores/matchDataStore';
import { useMatchPickerStore } from './stores/matchPickerStore';
import {
  createFixtureLineup,
  createFixtureStatistics,
} from './test/matchDataFixtures';

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
const navigateFixtureDate = vi.fn(async () => undefined);

afterEach(cleanup);

beforeEach(() => {
  loadAvailableLeagues.mockClear();
  selectLeagueAndLoadFixtures.mockClear();
  selectDateAndLoadFixtures.mockClear();
  navigateFixtureDate.mockClear();
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
    navigateFixtureDate,
  });
  useMatchDataStore.setState({
    status: { loadStatus: 'ready' },
    lineup: {
      loadStatus: 'ready',
      data: createFixtureLineup(),
    },
    statistics: {
      loadStatus: 'ready',
      data: createFixtureStatistics(),
    },
    events: {
      loadStatus: 'ready',
      data: { fixtureUid: 'fixture-1', events: [] },
    },
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

  it('shows fixture events in the Events tab', async () => {
    const user = userEvent.setup();
    useMatchPickerStore.setState({ selectedFixtureUid: 'fixture-1' });
    useMatchDataStore.setState({
      events: {
        loadStatus: 'ready',
        data: {
          fixtureUid: 'fixture-1',
          events: [
            {
              sequence: 1,
              elapsed: 27,
              extraTime: null,
              team: {
                teamUid: 'home-team',
                name: 'Home',
                koreanName: '홈',
                playerColor: null,
              },
              player: {
                matchPlayerUid: 'home-player-1',
                playerUid: null,
                name: 'Scorer',
                koreanName: null,
                number: 1,
              },
              assist: null,
              type: 'Goal',
              detail: 'Normal Goal',
              comments: null,
            },
            {
              sequence: 2,
              elapsed: 28,
              extraTime: null,
              team: {
                teamUid: 'home-team',
                name: 'Home',
                koreanName: '홈',
                playerColor: null,
              },
              player: {
                matchPlayerUid: 'home-player-2',
                playerUid: null,
                name: 'Booked',
                koreanName: null,
                number: 2,
              },
              assist: null,
              type: 'Card',
              detail: 'Yellow Card',
              comments: null,
            },
          ],
        },
      },
    });
    render(<ContentApp />);

    await user.click(screen.getByRole('tab', { name: 'Events' }));

    expect(screen.getByText('홈')).toBeTruthy();
    const cluster = document.querySelector<HTMLElement>(
      '.footballay-match-panel__event',
    );
    const tooltip = document.querySelector<HTMLElement>(
      '.footballay-match-panel__event-tooltip',
    );
    expect(cluster).toBeTruthy();
    expect(tooltip).toBeTruthy();
    expect(
      document.querySelectorAll('.footballay-match-panel__event'),
    ).toHaveLength(1);
    expect(
      document.querySelector('.footballay-match-panel__event-markers')
        ?.firstElementChild?.tagName,
    ).toBe('B');

    const showPopover = vi.fn();
    Object.assign(tooltip!, {
      matches: () => false,
      showPopover,
    });
    fireEvent.pointerMove(cluster!, { clientX: 100, clientY: 100 });

    expect(showPopover).toHaveBeenCalledOnce();
    expect(within(tooltip!).getByText('Scorer')).toBeTruthy();
    expect(within(tooltip!).getByText('Booked')).toBeTruthy();
  });

  it('keeps the Events tab mounted while switching fixtures', async () => {
    const user = userEvent.setup();
    useMatchPickerStore.setState({ selectedFixtureUid: 'fixture-1' });
    render(<ContentApp />);

    await user.click(screen.getByRole('tab', { name: 'Events' }));
    act(() => {
      useMatchPickerStore.setState({ selectedFixtureUid: 'fixture-2' });
      useMatchDataStore.setState({ events: { loadStatus: 'loading' } });
    });

    expect(screen.getByRole('tab', { name: 'Events' })).toBeTruthy();
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

  it('returns to matches when navigating dates from the date picker', async () => {
    const user = userEvent.setup();
    render(<ContentApp />);

    await user.click(
      screen.getByRole('button', { name: 'Fixture date picker' }),
    );
    expect(screen.getByRole('button', { name: 'Match' }).className).toContain(
      'footballay-topbar-tab--active-text',
    );

    await user.click(
      screen.getByRole('button', { name: 'Previous fixture date' }),
    );

    expect(navigateFixtureDate).toHaveBeenCalledWith('previous');
    expect(screen.getByRole('region', { name: 'Fixtures' })).toBeTruthy();
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
    expect(screen.getAllByText('Corner Kicks')).toHaveLength(1);
    expect(screen.getAllByText('Offsides')).toHaveLength(1);
    expect(screen.getByText('Goalkeeper Saves')).toBeTruthy();
    expect(screen.getByText('Goals Prevented')).toBeTruthy();
  });

  it('shows a lineup error without hiding successful statistics', async () => {
    const user = userEvent.setup();
    useMatchPickerStore.setState({ selectedFixtureUid: 'fixture-1' });
    useMatchDataStore.setState((state) => ({
      lineup: { ...state.lineup, loadStatus: 'error', error: 'lineup failed' },
    }));
    render(<ContentApp />);

    expect(screen.getByRole('alert').textContent).toBe(
      '라인업 데이터를 불러오지 못했습니다: lineup failed',
    );
    await user.click(screen.getByRole('tab', { name: 'Statistics' }));
    expect(screen.getByText('Possession')).toBeTruthy();
  });

  it('falls back to the home lineup when the selected away lineup disappears', async () => {
    const user = userEvent.setup();
    useMatchPickerStore.setState({ selectedFixtureUid: 'fixture-1' });
    render(<ContentApp />);

    await user.click(screen.getByRole('tab', { name: '원정' }));
    act(() => {
      useMatchPickerStore.setState({ selectedFixtureUid: 'fixture-2' });
      useMatchDataStore.setState((state) => ({
        lineup: state.lineup.data
          ? {
              ...state.lineup,
              data: {
                ...state.lineup.data,
                fixtureUid: 'fixture-2',
                lineup: { ...state.lineup.data.lineup, away: null },
              },
            }
          : state.lineup,
      }));
    });

    expect(screen.getByText('Home Player')).toBeTruthy();
    expect(
      screen.getByRole('tab', { name: '홈' }).getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('shows an empty state when only one team has statistics', async () => {
    const user = userEvent.setup();
    useMatchPickerStore.setState({ selectedFixtureUid: 'fixture-1' });
    useMatchDataStore.setState((state) => ({
      statistics: state.statistics.data
        ? {
            ...state.statistics,
            data: { ...state.statistics.data, away: null },
          }
        : state.statistics,
    }));
    render(<ContentApp />);

    await user.click(screen.getByRole('tab', { name: 'Statistics' }));
    expect(screen.getByText('통계 데이터가 없습니다.')).toBeTruthy();
  });

  it('normalizes team colors and keeps statistic bar ratios', async () => {
    const user = userEvent.setup();
    useMatchPickerStore.setState({ selectedFixtureUid: 'fixture-1' });
    useMatchDataStore.setState((state) => ({
      statistics:
        state.statistics.data &&
        state.statistics.data.home &&
        state.statistics.data.away
          ? {
              ...state.statistics,
              data: {
                ...state.statistics.data,
                home: {
                  ...state.statistics.data.home,
                  team: {
                    ...state.statistics.data.home.team,
                    playerColor: {
                      primary: 'abd1f5',
                      number: '000000',
                      border: null,
                    },
                  },
                },
                away: {
                  ...state.statistics.data.away,
                  team: {
                    ...state.statistics.data.away.team,
                    playerColor: {
                      primary: '7000ff',
                      number: 'ffffff',
                      border: null,
                    },
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
