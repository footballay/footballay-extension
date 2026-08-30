import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExtensionSettings } from '@/shared/settings/settings';

const storage = vi.hoisted(() => {
  let listener: ((settings: ExtensionSettings) => void) | undefined;
  return {
    load: vi.fn(async () => ({
      enabled: true,
      locale: 'default',
      timezone: 'default',
      panelOpacity: 90,
      lineupPlayerCardOpacity: 100,
    })),
    save: vi.fn(async (settings: ExtensionSettings) => {
      listener?.(settings);
    }),
    watch: vi.fn((next: (settings: ExtensionSettings) => void) => {
      listener = next;
      return () => {
        listener = undefined;
      };
    }),
    notify(settings: ExtensionSettings) {
      listener?.(settings);
    },
  };
});
const fixtureSelection = vi.hoisted(() => ({
  reloadForSettings: vi.fn(async () => undefined),
}));
const matchData = vi.hoisted(() => ({
  reloadLocalized: vi.fn(async () => undefined),
}));

vi.mock('@/shared/settings/settings', () => ({
  DEFAULT_SETTINGS: {
    enabled: true,
    locale: 'default',
    timezone: 'default',
    panelOpacity: 90,
    lineupPlayerCardOpacity: 100,
  },
  loadExtensionSettings: storage.load,
  saveExtensionSettings: storage.save,
  watchExtensionSettings: storage.watch,
  normalizeSettings: (settings: ExtensionSettings) => settings,
}));
vi.mock('@/content/features/fixture-selection', () => ({ fixtureSelection }));
vi.mock('@/content/features/match-data', () => ({ matchData }));

import { settingsManager } from './settingsManager';
import { settingsStore } from './settingsStore';

async function flushReactions() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('SettingsManager', () => {
  beforeEach(async () => {
    settingsManager.dispose();
    storage.load.mockClear();
    storage.save.mockClear();
    storage.watch.mockClear();
    storage.save.mockImplementation(async (settings: ExtensionSettings) => {
      storage.notify(settings);
    });
    fixtureSelection.reloadForSettings.mockClear();
    matchData.reloadLocalized.mockClear();
    settingsStore.setState({
      settings: {
        enabled: true,
        locale: 'default',
        timezone: 'default',
        panelOpacity: 90,
        lineupPlayerCardOpacity: 100,
      },
      hydrated: false,
    });
    await settingsManager.initialize();
  });

  it('reacts once when a local save is echoed by the storage watcher', async () => {
    await settingsManager.updateSettings({
      enabled: true,
      locale: 'ko',
      timezone: 'default',
      panelOpacity: 90,
      lineupPlayerCardOpacity: 100,
    });
    await flushReactions();

    expect(storage.save).toHaveBeenCalledOnce();
    expect(fixtureSelection.reloadForSettings).toHaveBeenCalledOnce();
    expect(fixtureSelection.reloadForSettings).toHaveBeenCalledWith({
      localeChanged: true,
      timezoneChanged: false,
    });
    expect(matchData.reloadLocalized).toHaveBeenCalledOnce();

    storage.notify({
      enabled: true,
      locale: 'ko',
      timezone: 'default',
      panelOpacity: 90,
      lineupPlayerCardOpacity: 100,
    });
    await flushReactions();
    expect(fixtureSelection.reloadForSettings).toHaveBeenCalledOnce();
  });

  it('reacts to external storage changes through the same path', async () => {
    storage.notify({
      enabled: true,
      locale: 'default',
      timezone: 'Asia/Seoul',
      panelOpacity: 90,
      lineupPlayerCardOpacity: 100,
    });
    await flushReactions();

    expect(fixtureSelection.reloadForSettings).toHaveBeenCalledWith({
      localeChanged: false,
      timezoneChanged: true,
    });
    expect(matchData.reloadLocalized).not.toHaveBeenCalled();
    expect(settingsStore.getState().settings.timezone).toBe('Asia/Seoul');
  });

  it('coalesces rapid local updates and applies only the latest settings', async () => {
    let resolveFirstSave!: () => void;
    storage.save
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveFirstSave = resolve;
          }),
      )
      .mockImplementationOnce(async (settings: ExtensionSettings) => {
        storage.notify(settings);
      });

    const first = settingsManager.updateSettings({
      enabled: true,
      locale: 'ko',
      timezone: 'default',
      panelOpacity: 90,
      lineupPlayerCardOpacity: 100,
    });
    const latest = settingsManager.updateSettings({
      enabled: true,
      locale: 'en',
      timezone: 'Asia/Seoul',
      panelOpacity: 90,
      lineupPlayerCardOpacity: 100,
    });
    resolveFirstSave();
    await Promise.all([first, latest]);
    await flushReactions();

    expect(storage.save).toHaveBeenCalledTimes(2);
    expect(fixtureSelection.reloadForSettings).toHaveBeenCalledOnce();
    expect(fixtureSelection.reloadForSettings).toHaveBeenCalledWith({
      localeChanged: true,
      timezoneChanged: true,
    });
    expect(matchData.reloadLocalized).toHaveBeenCalledOnce();
    expect(settingsStore.getState().settings).toEqual({
      enabled: true,
      locale: 'en',
      timezone: 'Asia/Seoul',
      panelOpacity: 90,
      lineupPlayerCardOpacity: 100,
    });
  });

  it('ignores a delayed echo from an older local save', async () => {
    let resolveFirstSave!: () => void;
    const firstSettings: ExtensionSettings = {
      enabled: true,
      locale: 'ko',
      timezone: 'default',
      panelOpacity: 90,
      lineupPlayerCardOpacity: 100,
    };
    const latestSettings: ExtensionSettings = {
      enabled: true,
      locale: 'en',
      timezone: 'Asia/Seoul',
      panelOpacity: 90,
      lineupPlayerCardOpacity: 100,
    };
    storage.save
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveFirstSave = resolve;
          }),
      )
      .mockImplementationOnce(async (settings: ExtensionSettings) => {
        storage.notify(settings);
      });

    const first = settingsManager.updateSettings(firstSettings);
    const latest = settingsManager.updateSettings(latestSettings);
    resolveFirstSave();
    await Promise.all([first, latest]);
    await flushReactions();

    storage.notify(firstSettings);
    await flushReactions();

    expect(storage.save).toHaveBeenCalledTimes(2);
    expect(fixtureSelection.reloadForSettings).toHaveBeenCalledOnce();
    expect(fixtureSelection.reloadForSettings).toHaveBeenCalledWith({
      localeChanged: true,
      timezoneChanged: true,
    });
    expect(matchData.reloadLocalized).toHaveBeenCalledOnce();
    expect(settingsStore.getState().settings).toEqual(latestSettings);
  });

  it('coalesces rapid external changes and applies only the latest settings', async () => {
    storage.notify({
      enabled: true,
      locale: 'ko',
      timezone: 'default',
      panelOpacity: 90,
      lineupPlayerCardOpacity: 100,
    });
    storage.notify({
      enabled: true,
      locale: 'en',
      timezone: 'Asia/Seoul',
      panelOpacity: 90,
      lineupPlayerCardOpacity: 100,
    });
    await flushReactions();

    expect(fixtureSelection.reloadForSettings).toHaveBeenCalledOnce();
    expect(fixtureSelection.reloadForSettings).toHaveBeenCalledWith({
      localeChanged: true,
      timezoneChanged: true,
    });
    expect(matchData.reloadLocalized).toHaveBeenCalledOnce();
    expect(settingsStore.getState().settings).toEqual({
      enabled: true,
      locale: 'en',
      timezone: 'Asia/Seoul',
      panelOpacity: 90,
      lineupPlayerCardOpacity: 100,
    });
  });

  it('applies panel opacity without reloading match data', async () => {
    await settingsManager.updateSettings({
      enabled: true,
      locale: 'default',
      timezone: 'default',
      panelOpacity: 50,
      lineupPlayerCardOpacity: 100,
    });
    await flushReactions();

    expect(settingsStore.getState().settings.panelOpacity).toBe(50);
    expect(fixtureSelection.reloadForSettings).not.toHaveBeenCalled();
    expect(matchData.reloadLocalized).not.toHaveBeenCalled();
  });

  it('applies lineup player card opacity without reloading match data', async () => {
    await settingsManager.updateSettings({
      enabled: true,
      locale: 'default',
      timezone: 'default',
      panelOpacity: 90,
      lineupPlayerCardOpacity: 50,
    });
    await flushReactions();

    expect(settingsStore.getState().settings.lineupPlayerCardOpacity).toBe(50);
    expect(fixtureSelection.reloadForSettings).not.toHaveBeenCalled();
    expect(matchData.reloadLocalized).not.toHaveBeenCalled();
  });

  it('applies enabled state without reloading match data', async () => {
    await settingsManager.updateSettings({
      enabled: false,
      locale: 'default',
      timezone: 'default',
      panelOpacity: 90,
      lineupPlayerCardOpacity: 100,
    });
    await flushReactions();

    expect(settingsStore.getState().settings.enabled).toBe(false);
    expect(fixtureSelection.reloadForSettings).not.toHaveBeenCalled();
    expect(matchData.reloadLocalized).not.toHaveBeenCalled();
  });
});
