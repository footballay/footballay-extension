// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { matchDataStore } from '@/content/match-data/matchDataStore';
import { MatchDataOverlays } from './MatchDataOverlays';
import type { FixtureDto } from '@/shared/api/dto';

const settingsView = vi.hoisted(() => ({
  settings: { locale: 'default', timezone: 'default' },
  updateSettings: vi.fn(),
}));

vi.mock('@/content/settings', () => ({
  getSettings: () => settingsView.settings,
  useSettings: () => settingsView,
}));

const fixtureInfo: FixtureDto = {
  uid: 'fixture-1',
  kickoff: null,
  round: 'Regular Season',
  homeTeam: null,
  awayTeam: null,
  status: { longStatus: 'Not Started', shortStatus: 'NS', elapsed: null },
  score: { home: null, away: null },
  available: true,
};

afterEach(cleanup);

beforeEach(() => {
  settingsView.settings = { locale: 'default', timezone: 'default' };
  settingsView.updateSettings.mockReset();
  matchDataStore.setState({
    fixtureInfo,
    status: { loadStatus: 'loading' },
    lineup: { loadStatus: 'loading' },
    events: { loadStatus: 'loading' },
    statistics: { loadStatus: 'loading' },
  });
});

describe('MatchDataOverlays', () => {
  it('shows the loading message in every tab while match data is loading', () => {
    render(<MatchDataOverlays />);

    expect(screen.getByText('Loading data')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Statistics' }));
    expect(screen.getByText('Loading data')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Events' }));
    expect(screen.getByText('Loading data')).toBeTruthy();
  });

  it('shows only the Statistics resource error in the Statistics tab', () => {
    matchDataStore.setState({
      status: { loadStatus: 'ready' },
      lineup: { loadStatus: 'ready' },
      events: { loadStatus: 'ready' },
      statistics: { loadStatus: 'error', error: 'statistics failed' },
    });
    render(<MatchDataOverlays />);

    fireEvent.click(screen.getByRole('tab', { name: 'Statistics' }));

    expect(screen.getByRole('alert').textContent).toBe(
      'Failed to load statistics data: statistics failed',
    );
  });

  it('shows only the Events resource error in the Events tab', () => {
    matchDataStore.setState({
      status: { loadStatus: 'ready' },
      lineup: { loadStatus: 'ready' },
      events: { loadStatus: 'error', error: 'events failed' },
      statistics: { loadStatus: 'ready' },
    });
    render(<MatchDataOverlays />);

    fireEvent.click(screen.getByRole('tab', { name: 'Events' }));

    expect(screen.getByRole('alert').textContent).toBe(
      'Failed to load events data: events failed',
    );
  });

  it('keeps an empty events timeline without an empty-state message', () => {
    matchDataStore.setState({
      status: { loadStatus: 'ready' },
      lineup: { loadStatus: 'ready' },
      events: {
        loadStatus: 'ready',
        data: { fixtureUid: 'fixture-1', events: [] },
      },
      statistics: { loadStatus: 'ready' },
    });
    render(<MatchDataOverlays />);

    fireEvent.click(screen.getByRole('tab', { name: 'Events' }));

    expect(screen.getByLabelText('Match events timeline')).toBeTruthy();
    expect(screen.queryByText('No events data.')).toBeNull();
  });

  it('collapses and expands the match panel', () => {
    render(<MatchDataOverlays />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Minimize match panel' }),
    );
    expect(
      screen.getByRole('button', { name: 'Open match panel' }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Open match panel' }));
    expect(screen.getByRole('tab', { name: 'Lineup' })).toBeTruthy();
  });

  it('opens Settings from the sidebar and saves language and timezone choices', () => {
    const updateSettings = settingsView.updateSettings;
    render(<MatchDataOverlays />);

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByLabelText('Language')).toBeTruthy();
    expect(screen.getByLabelText('Timezone').textContent).toContain(
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    );

    fireEvent.change(screen.getByLabelText('Language'), {
      target: { value: 'ko' },
    });
    expect(updateSettings).toHaveBeenCalledWith({
      locale: 'ko',
      timezone: 'default',
    });

    fireEvent.change(screen.getByLabelText('Timezone'), {
      target: { value: 'custom' },
    });
    fireEvent.change(screen.getByLabelText('Custom timezone'), {
      target: { value: 'Asia/Seoul' },
    });
    expect(updateSettings).toHaveBeenLastCalledWith({
      locale: 'default',
      timezone: 'Asia/Seoul',
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Events' }));
    expect(screen.getByLabelText('Match events timeline')).toBeTruthy();
  });

  it('does not save an invalid custom timezone over the current setting', () => {
    const updateSettings = vi.fn();
    settingsView.settings = { locale: 'default', timezone: 'Asia/Seoul' };
    settingsView.updateSettings = updateSettings;
    render(<MatchDataOverlays />);

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.change(screen.getByLabelText('Custom timezone'), {
      target: { value: 'UTC+9' },
    });

    expect(updateSettings).not.toHaveBeenCalled();
    expect(settingsView.settings.timezone).toBe('Asia/Seoul');
  });
});
