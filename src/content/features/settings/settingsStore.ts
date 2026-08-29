import { createStore } from 'zustand/vanilla';
import {
  DEFAULT_SETTINGS,
  type ExtensionSettings,
} from '@/shared/settings/settings';

export type SettingsState = {
  settings: ExtensionSettings;
  hydrated: boolean;
};

export const settingsStore = createStore<SettingsState>(() => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,
}));
