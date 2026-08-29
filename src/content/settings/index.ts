import { useStore } from 'zustand';
import { settingsManager } from './settingsManager';
import { settingsStore } from './settingsStore';
import type { ExtensionSettings } from '@/shared/settings/settings';

export const settings = Object.freeze({
  initialize: () => settingsManager.initialize(),
  update: (nextSettings: ExtensionSettings) =>
    settingsManager.updateSettings(nextSettings),
  dispose: () => settingsManager.dispose(),
});

export function getSettings() {
  return settingsStore.getState().settings;
}

export function useSettings() {
  const state = useStore(settingsStore);
  return { ...state, updateSettings: settings.update };
}
