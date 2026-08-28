// @vitest-environment jsdom

import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const settingsApi = vi.hoisted(() => {
  let resolve:
    | ((settings: { locale: 'default'; timezone: 'default' }) => void)
    | undefined;
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
const reloadFixturesForLocale = vi.fn(async () => undefined);
const reloadFixturesForTimezone = vi.fn(async () => undefined);
const reloadLocalizedMatchData = vi.fn(async () => undefined);

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
import { useMatchDataStore } from './stores/matchDataStore';
import { useMatchPickerStore } from './stores/matchPickerStore';
import { useSettingsStore } from './stores/settingsStore';

afterEach(cleanup);

beforeEach(() => {
  settingsApi.loadExtensionSettings.mockClear();
  sync.startMatchDataSync.mockClear();
  loadAvailableLeagues.mockClear();
  reloadFixturesForLocale.mockClear();
  reloadFixturesForTimezone.mockClear();
  reloadLocalizedMatchData.mockClear();
  useSettingsStore.setState({
    hydrated: false,
    settings: { locale: 'default', timezone: 'default' },
  });
  useMatchPickerStore.setState({
    loadAvailableLeagues,
    reloadFixturesForLocale,
    reloadFixturesForTimezone,
  });
  useMatchDataStore.setState({ reloadLocalizedMatchData });
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

  it('reloads only locale-dependent resources after a language change', async () => {
    render(<ContentApp />);
    await act(async () => settingsApi.resolve());
    loadAvailableLeagues.mockClear();

    await act(async () => {
      useSettingsStore.setState({
        settings: { locale: 'ko', timezone: 'default' },
      });
    });

    expect(loadAvailableLeagues).toHaveBeenCalledOnce();
    expect(reloadFixturesForLocale).toHaveBeenCalledOnce();
    expect(reloadLocalizedMatchData).toHaveBeenCalledOnce();
    expect(reloadFixturesForTimezone).not.toHaveBeenCalled();
  });

  it('reloads the current fixture date for a timezone change without a localized reload', async () => {
    render(<ContentApp />);
    await act(async () => settingsApi.resolve());
    loadAvailableLeagues.mockClear();

    await act(async () => {
      useSettingsStore.setState({
        settings: { locale: 'default', timezone: 'Asia/Seoul' },
      });
    });

    expect(reloadFixturesForTimezone).toHaveBeenCalledOnce();
    expect(loadAvailableLeagues).not.toHaveBeenCalled();
    expect(reloadFixturesForLocale).not.toHaveBeenCalled();
    expect(reloadLocalizedMatchData).not.toHaveBeenCalled();
  });
});
