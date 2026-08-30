// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { matchDataStore } from '@/content/features/match-data/matchDataStore';
import { createFixtureStatistics } from '@/content/test/matchDataFixtures';
import { MatchDataOverlays } from './MatchDataOverlays';
import type { FixtureDto } from '@/shared/api/dto';

const settingsView = vi.hoisted(() => ({
  settings: {
    locale: 'default',
    timezone: 'default',
    panelOpacity: 90,
    lineupPlayerCardOpacity: 100,
  },
  updateSettings: vi.fn(),
}));

vi.mock('@/content/features/settings', () => ({
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

const matchPanelCss = readFileSync(
  'src/content/components/match-panel/match-data-overlays.css',
  'utf8',
);
const lineupTabCss = readFileSync(
  'src/content/components/match-panel/lineup/lineup-tab.css',
  'utf8',
);
const lineupTabSource = readFileSync(
  'src/content/components/match-panel/lineup/LineupTab.tsx',
  'utf8',
);
const statisticsTabCss = readFileSync(
  'src/content/components/match-panel/statistics/statistics-tab.css',
  'utf8',
);

afterEach(cleanup);

beforeEach(() => {
  settingsView.settings = {
    locale: 'default',
    timezone: 'default',
    panelOpacity: 90,
    lineupPlayerCardOpacity: 100,
  };
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

  it('does not render undefined pass accuracy text or progress', () => {
    const statistics = createFixtureStatistics();
    Object.assign(statistics.home!.teamStatistics, {
      passesAccuracyPercentage: Number.NaN,
      passesAccurate: 0,
      totalPasses: 100,
    });
    matchDataStore.setState({
      status: { loadStatus: 'ready' },
      lineup: { loadStatus: 'ready' },
      events: { loadStatus: 'ready' },
      statistics: { loadStatus: 'ready', data: statistics },
    });
    render(<MatchDataOverlays />);

    fireEvent.click(screen.getByRole('tab', { name: 'Statistics' }));

    const circle = document.querySelector(
      '.footballay-match-panel__pass-accuracy i',
    );
    expect(screen.queryByText('undefined%')).toBeNull();
    expect(circle?.getAttribute('style')).not.toContain('undefined%');
    expect(circle?.getAttribute('style')).toContain('0%');
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
      panelOpacity: 90,
      lineupPlayerCardOpacity: 100,
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
      panelOpacity: 90,
      lineupPlayerCardOpacity: 100,
    });

    fireEvent.change(screen.getByLabelText('Panel opacity'), {
      target: { value: '60' },
    });
    expect(updateSettings).toHaveBeenLastCalledWith({
      locale: 'default',
      timezone: 'default',
      panelOpacity: 60,
      lineupPlayerCardOpacity: 100,
    });

    fireEvent.change(screen.getByLabelText('Player card opacity'), {
      target: { value: '50' },
    });
    expect(updateSettings).toHaveBeenLastCalledWith({
      locale: 'default',
      timezone: 'default',
      panelOpacity: 90,
      lineupPlayerCardOpacity: 50,
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Events' }));
    expect(screen.getByLabelText('Match events timeline')).toBeTruthy();
  });

  it('does not save an invalid custom timezone over the current setting', () => {
    const updateSettings = vi.fn();
    settingsView.settings = {
      locale: 'default',
      timezone: 'Asia/Seoul',
      panelOpacity: 90,
      lineupPlayerCardOpacity: 100,
    };
    settingsView.updateSettings = updateSettings;
    render(<MatchDataOverlays />);

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.change(screen.getByLabelText('Custom timezone'), {
      target: { value: 'UTC+9' },
    });

    expect(updateSettings).not.toHaveBeenCalled();
    expect(settingsView.settings.timezone).toBe('Asia/Seoul');
  });

  it('applies panel opacity only outside Settings', () => {
    settingsView.settings = {
      locale: 'default',
      timezone: 'default',
      panelOpacity: 50,
      lineupPlayerCardOpacity: 100,
    };
    render(<MatchDataOverlays />);

    const panel = screen.getByLabelText('Match panel');
    expect(panel.className).toContain('footballay-match-panel--data');
    expect(panel.getAttribute('style')).toContain(
      '--footballay-panel-opacity: 50%',
    );
    expect(panel.getAttribute('style')).toContain(
      '--footballay-lineup-player-card-opacity: 100%',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(panel.className).not.toContain('footballay-match-panel--data');
  });

  it('applies opacity to data backgrounds without nesting it at the root', () => {
    expect(matchPanelCss).toContain(
      '.footballay-match-panel--data {\n  background: transparent;',
    );
    expect(matchPanelCss).toContain(
      '.footballay-match-panel--data .footballay-match-panel__lineup,',
    );
    expect(matchPanelCss).toContain(
      '.footballay-match-panel--data .footballay-match-panel__events {',
    );
    expect(matchPanelCss).toContain(
      '.footballay-match-panel__statistics:has(\n    > .footballay-match-panel__statistics-column',
    );
    expect(matchPanelCss).toContain(
      '.footballay-match-panel--data .footballay-match-panel__statistics-column {',
    );
  });

  it('aligns the panel opacity range thumb with the control edges', () => {
    expect(matchPanelCss).toContain(
      "input[type='range'] {\n  --footballay-settings-range-thumb-size: 12px;",
    );
    expect(matchPanelCss).toContain(
      'padding: 0 calc(var(--footballay-settings-range-thumb-size) / 2);',
    );
    expect(matchPanelCss).toContain(
      'width: var(--footballay-settings-range-thumb-size);',
    );
    expect(matchPanelCss).toContain(
      'height: var(--footballay-settings-range-thumb-size);',
    );
  });

  it('uses one opacity value for both lineup player card backgrounds', () => {
    expect(lineupTabCss).toContain(
      '10 16 31 / var(--footballay-lineup-player-card-opacity)',
    );
    expect(lineupTabCss).toContain(
      '244 247 251 / var(--footballay-lineup-player-card-opacity)',
    );
  });

  it('uses the requested lineup marker sizes', () => {
    expect(lineupTabCss).toMatch(
      /\.footballay-match-panel__rating \{[\s\S]*height: 10px;[\s\S]*padding: 1px 2px 0;[\s\S]*font-size: 11px;[\s\S]*line-height: 9px;/,
    );
    expect(lineupTabCss).toMatch(
      /\.footballay-match-panel__goals img \{[\s\S]*width: 15px;[\s\S]*height: 15px;/,
    );
  });

  it('keeps full player names available on lineup hover', () => {
    expect(lineupTabSource).toContain(
      '<div className="footballay-match-panel__player-name-tooltip">',
    );
    expect(lineupTabSource).toContain('{player.player.name}');
    expect(lineupTabSource).not.toContain('title={player.player.name}');
    expect(lineupTabCss).toContain(
      '.footballay-match-panel__player-name-tooltip {\n  position: absolute;',
    );
    expect(lineupTabCss).toContain('transition: opacity 0.2s ease;');
    expect(lineupTabCss).toContain(
      '.footballay-match-panel__player-main:hover\n  ~ .footballay-match-panel__player-name-tooltip {\n  opacity: 1;\n  transition: none;',
    );
  });

  it('moves only pass accuracy text down by one pixel', () => {
    expect(statisticsTabCss).toContain(
      '.footballay-match-panel__pass-accuracy i > span {\n  transform: translateY(1px);',
    );
  });

  it('fades sidebar and topbar without removing their layout', () => {
    expect(matchPanelCss).toContain(
      '.footballay-match-panel--chrome-hidden .footballay-match-panel__sidebar,',
    );
    expect(matchPanelCss).toContain(
      '.footballay-match-panel--chrome-hidden .footballay-match-panel__topbar {\n  opacity: 0;\n  pointer-events: none;',
    );
    expect(matchPanelCss).not.toContain(
      '.footballay-match-panel--chrome-hidden .footballay-match-panel__topbar {\n  display: none;',
    );
    expect(matchPanelCss).toMatch(
      /\.footballay-match-panel__sidebar \{[\s\S]*opacity: 1;[\s\S]*transition: opacity 0\.35s ease;/,
    );
    expect(matchPanelCss).toMatch(
      /\.footballay-match-panel__topbar \{[\s\S]*opacity: 1;[\s\S]*transition: opacity 0\.35s ease;/,
    );
    expect(matchPanelCss).toContain(
      '.footballay-match-panel--chrome-hidden .footballay-match-panel__lineup,\n.footballay-match-panel--chrome-hidden .footballay-match-panel__events,\n.footballay-match-panel--chrome-hidden .footballay-match-panel__statistics {\n  border-radius: 5px;',
    );
    expect(statisticsTabCss).toMatch(
      /\.footballay-match-panel__statistics \{[\s\S]*overflow: hidden;/,
    );
  });

  it('starts the initial chrome hide timer while the pointer is outside', () => {
    vi.useFakeTimers();
    try {
      render(<MatchDataOverlays />);
      const panel = screen.getByLabelText('Match panel');

      act(() => vi.advanceTimersByTime(1_499));
      expect(panel.className).not.toContain(
        'footballay-match-panel--chrome-hidden',
      );

      act(() => vi.advanceTimersByTime(1));
      expect(panel.className).toContain(
        'footballay-match-panel--chrome-hidden',
      );
      expect(
        panel.querySelector('.footballay-match-panel__sidebar'),
      ).toBeTruthy();
      expect(
        panel.querySelector('.footballay-match-panel__topbar'),
      ).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels the initial chrome hide timer when the pointer enters', () => {
    vi.useFakeTimers();
    try {
      render(<MatchDataOverlays />);
      const panel = screen.getByLabelText('Match panel');

      act(() => vi.advanceTimersByTime(1_000));
      fireEvent.pointerEnter(panel);
      act(() => vi.advanceTimersByTime(1_500));
      expect(panel.className).not.toContain(
        'footballay-match-panel--chrome-hidden',
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('hides and restores panel chrome after pointer leave', () => {
    vi.useFakeTimers();
    try {
      render(<MatchDataOverlays />);
      const panel = screen.getByLabelText('Match panel');

      expect(panel.className).not.toContain(
        'footballay-match-panel--chrome-hidden',
      );
      fireEvent.pointerLeave(panel);
      act(() => vi.advanceTimersByTime(1_499));
      expect(panel.className).not.toContain(
        'footballay-match-panel--chrome-hidden',
      );

      act(() => vi.advanceTimersByTime(1));
      expect(panel.className).toContain(
        'footballay-match-panel--chrome-hidden',
      );

      fireEvent.pointerEnter(panel);
      expect(panel.className).not.toContain(
        'footballay-match-panel--chrome-hidden',
      );

      fireEvent.pointerLeave(panel);
      act(() => vi.advanceTimersByTime(1_499));
      fireEvent.pointerEnter(panel);
      act(() => vi.advanceTimersByTime(1));
      expect(panel.className).not.toContain(
        'footballay-match-panel--chrome-hidden',
      );

      fireEvent.pointerLeave(panel);
      act(() => vi.advanceTimersByTime(1_500));
      expect(panel.className).toContain(
        'footballay-match-panel--chrome-hidden',
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the expand button visible and clears pending timers while collapsed', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    try {
      render(<MatchDataOverlays />);
      const panel = screen.getByLabelText('Match panel');
      fireEvent.pointerLeave(panel);
      fireEvent.click(
        screen.getByRole('button', { name: 'Minimize match panel' }),
      );

      act(() => vi.advanceTimersByTime(1_500));
      expect(
        screen.getByRole('button', { name: 'Open match panel' }),
      ).toBeTruthy();
      expect(clearTimeoutSpy).toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: 'Open match panel' }));
      const expandedPanel = screen.getByLabelText('Match panel');
      expect(expandedPanel.className).not.toContain(
        'footballay-match-panel--chrome-hidden',
      );
      act(() => vi.advanceTimersByTime(1_500));
      expect(expandedPanel.className).toContain(
        'footballay-match-panel--chrome-hidden',
      );
    } finally {
      clearTimeoutSpy.mockRestore();
      vi.useRealTimers();
    }
  });

  it('clears pending chrome timers on unmount', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    try {
      const { unmount } = render(<MatchDataOverlays />);
      fireEvent.pointerLeave(screen.getByLabelText('Match panel'));
      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    } finally {
      clearTimeoutSpy.mockRestore();
      vi.useRealTimers();
    }
  });
});
