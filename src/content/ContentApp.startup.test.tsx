// @vitest-environment jsdom

import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RestoreState } from '@/shared/restore/protocol';

const lifecycle = vi.hoisted(() => {
  let resolveSettings: (() => void) | undefined;

  return {
    calls: [] as string[],
    resolveSettings: () => resolveSettings?.(),
    initializeSettings: vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSettings = resolve;
        }),
    ),
    disposeSettings: vi.fn(() => lifecycle.calls.push('settings.dispose')),
    initializeFixtureSelection: vi.fn(async () => {
      lifecycle.calls.push('fixtureSelection.initialize');
    }),
    selectLeague: vi.fn(async () => undefined),
    selectDate: vi.fn(async () => undefined),
    selectFixture: vi.fn(),
    loadRestoreState: vi.fn<() => Promise<RestoreState | undefined>>(
      async () => undefined,
    ),
    disposeFixtureSelection: vi.fn(() =>
      lifecycle.calls.push('fixtureSelection.dispose'),
    ),
    disposeMatchData: vi.fn(() => lifecycle.calls.push('matchData.dispose')),
  };
});

vi.mock('@/content/features/settings', () => ({
  settings: {
    initialize: lifecycle.initializeSettings,
    dispose: lifecycle.disposeSettings,
  },
  useSettings: () => ({
    settings: { locale: 'default', timezone: 'default' },
    hydrated: false,
    updateSettings: vi.fn(),
  }),
}));
vi.mock('@/content/features/fixture-selection', () => ({
  fixtureSelection: {
    initialize: lifecycle.initializeFixtureSelection,
    selectLeague: lifecycle.selectLeague,
    selectDate: lifecycle.selectDate,
    selectFixture: lifecycle.selectFixture,
    dispose: lifecycle.disposeFixtureSelection,
  },
}));
vi.mock('@/content/features/restore/restoreManager', () => ({
  restoreManager: { load: lifecycle.loadRestoreState },
}));
vi.mock('@/content/features/match-data', () => ({
  matchData: { dispose: lifecycle.disposeMatchData },
}));
vi.mock('@/content/components/match-select/MatchSelect', () => ({
  MatchSelect: () => null,
}));
vi.mock('@/content/components/match-panel/MatchDataOverlays', () => ({
  MatchDataOverlays: () => null,
}));

import { ContentApp } from './ContentApp';

afterEach(cleanup);

beforeEach(() => {
  lifecycle.calls.length = 0;
  lifecycle.initializeSettings.mockClear();
  lifecycle.disposeSettings.mockClear();
  lifecycle.initializeFixtureSelection.mockClear();
  lifecycle.selectLeague.mockClear();
  lifecycle.selectDate.mockClear();
  lifecycle.selectFixture.mockClear();
  lifecycle.loadRestoreState.mockReset();
  lifecycle.loadRestoreState.mockResolvedValue(undefined);
  lifecycle.disposeFixtureSelection.mockClear();
  lifecycle.disposeMatchData.mockClear();
});

describe('ContentApp lifecycle', () => {
  it('initializes Fixture Selection after Settings and disposes every feature', async () => {
    const view = render(<ContentApp />);

    expect(lifecycle.initializeSettings).toHaveBeenCalledOnce();
    expect(lifecycle.initializeFixtureSelection).not.toHaveBeenCalled();

    await act(async () => lifecycle.resolveSettings());
    expect(lifecycle.initializeFixtureSelection).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(lifecycle.loadRestoreState).toHaveBeenCalledOnce(),
    );

    view.unmount();
    expect(lifecycle.calls).toEqual([
      'fixtureSelection.initialize',
      'fixtureSelection.dispose',
      'matchData.dispose',
      'settings.dispose',
    ]);
  });

  it('does not initialize Fixture Selection after unmount', async () => {
    const view = render(<ContentApp />);

    view.unmount();
    await act(async () => lifecycle.resolveSettings());

    expect(lifecycle.initializeFixtureSelection).not.toHaveBeenCalled();
    expect(lifecycle.disposeFixtureSelection).toHaveBeenCalledOnce();
    expect(lifecycle.disposeMatchData).toHaveBeenCalledOnce();
    expect(lifecycle.disposeSettings).toHaveBeenCalledOnce();
  });

  it('restores the saved league and fixture once after initialization', async () => {
    lifecycle.loadRestoreState.mockResolvedValue({
      leagueUid: 'league-1',
      selectedDate: '2026-09-02',
      fixtureUid: 'fixture-1',
      updatedAt: Date.now(),
    });
    render(<ContentApp />);

    await act(async () => lifecycle.resolveSettings());
    await waitFor(() => expect(lifecycle.selectFixture).toHaveBeenCalledOnce());

    expect(lifecycle.selectLeague).toHaveBeenCalledWith('league-1');
    expect(lifecycle.selectDate).toHaveBeenCalledWith('2026-09-02');
    expect(lifecycle.selectFixture).toHaveBeenCalledWith('fixture-1');
    expect(lifecycle.selectLeague.mock.invocationCallOrder[0]!).toBeLessThan(
      lifecycle.selectDate.mock.invocationCallOrder[0]!,
    );
    expect(lifecycle.selectDate.mock.invocationCallOrder[0]!).toBeLessThan(
      lifecycle.selectFixture.mock.invocationCallOrder[0]!,
    );
  });
});
