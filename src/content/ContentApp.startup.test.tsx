// @vitest-environment jsdom

import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const settingsApi = vi.hoisted(() => {
  let resolve: ((settings: { locale: 'default'; timezone: 'default' }) => void) | undefined;
  return {
    loadExtensionSettings: vi.fn(
      () =>
        new Promise<{ locale: 'default'; timezone: 'default' }>((next) => {
          resolve = next;
        }),
    ),
    watchExtensionSettings: vi.fn(() => () => undefined),
    saveExtensionSettings: vi.fn(),
    resolve: () => resolve?.({ locale: 'default', timezone: 'default' }),
  };
});

const sync = vi.hoisted(() => ({ startMatchDataSync: vi.fn() }));
const loadAvailableLeagues = vi.fn(async () => undefined);

vi.mock('@/shared/settings/settings', () => ({
  DEFAULT_SETTINGS: { locale: 'default', timezone: 'default' },
  ...settingsApi,
}));
vi.mock('@/content/matchDataSync', () => sync);
vi.mock('@/content/components/match-select/MatchSelect', () => ({
  MatchSelect: () => null,
}));
vi.mock('@/content/components/match-panel/MatchDataOverlays', () => ({
  MatchDataOverlays: () => null,
}));

import { ContentApp } from './ContentApp';
import { useMatchPickerStore } from './stores/matchPickerStore';
import { useSettingsStore } from './stores/settingsStore';

afterEach(cleanup);

beforeEach(() => {
  settingsApi.loadExtensionSettings.mockClear();
  sync.startMatchDataSync.mockClear();
  loadAvailableLeagues.mockClear();
  useSettingsStore.setState({
    hydrated: false,
    settings: { locale: 'default', timezone: 'default' },
  });
  useMatchPickerStore.setState({ loadAvailableLeagues });
});

describe('ContentApp startup', () => {
  it('waits for settings hydration before loading leagues and starting polling', async () => {
    render(<ContentApp />);

    expect(loadAvailableLeagues).not.toHaveBeenCalled();
    expect(sync.startMatchDataSync).not.toHaveBeenCalled();

    await act(async () => settingsApi.resolve());

    expect(loadAvailableLeagues).toHaveBeenCalledOnce();
    expect(sync.startMatchDataSync).toHaveBeenCalledOnce();
  });
});
