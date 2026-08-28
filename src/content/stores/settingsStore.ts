import { create } from 'zustand';
import {
  DEFAULT_SETTINGS,
  loadExtensionSettings,
  saveExtensionSettings,
  watchExtensionSettings,
  type ExtensionSettings,
} from '@/shared/settings/settings';

type SettingsState = {
  settings: ExtensionSettings;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  updateSettings: (settings: ExtensionSettings) => Promise<void>;
};

let unwatch: (() => void) | undefined;

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;

    const settings = await loadExtensionSettings();
    set({ settings, hydrated: true });
    unwatch ??= watchExtensionSettings((nextSettings) =>
      set({ settings: nextSettings }),
    );
  },
  updateSettings: async (settings) => {
    await saveExtensionSettings(settings);
  },
}));
