import { defaultSettings } from "@/shared/constants";
import type { ExtensionSettings } from "@/shared/overlay/types";
import { create } from "zustand";

type ContentSettingsState = {
  settings: ExtensionSettings;
};

type ContentSettingsActions = {
  setSettings: (settings: ExtensionSettings) => void;
};

type ContentSettingsStore = ContentSettingsState & ContentSettingsActions;

export const useContentSettingsStore = create<ContentSettingsStore>((set) => ({
  settings: defaultSettings,

  setSettings(settings) {
    set({ settings });
  }
}));
