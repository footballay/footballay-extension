// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentApp } from './ContentApp';
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

  it('switches match-data tabs for a selected fixture', async () => {
    const user = userEvent.setup();
    useMatchPickerStore.setState({ selectedFixtureUid: 'fixture-1' });
    render(<ContentApp />);

    expect(
      screen.getByRole('tab', { name: 'lineup' }).getAttribute('aria-selected'),
    ).toBe('true');
    await user.click(screen.getByRole('tab', { name: 'events' }));
    expect(
      screen.getByRole('tab', { name: 'events' }).getAttribute('aria-selected'),
    ).toBe('true');
  });
});
