import type { ExtensionSettings } from "@/shared/overlay/types";
import { readSettings, writeSettings } from "@/shared/storage";
import { useContentLiveDataStore } from "@/content/stores/contentLiveDataStore";
import { useContentOverlayViewStore } from "@/content/stores/contentOverlayViewStore";
import { useContentPageOverlayStore } from "@/content/stores/contentPageOverlayStore";
import { useContentSettingsStore } from "@/content/stores/contentSettingsStore";

export async function loadInitialContentOverlayState(): Promise<void> {
  useContentSettingsStore.getState().setSettings(await readSettings());
}

export async function updateContentOverlaySettings(patch: Partial<ExtensionSettings>): Promise<void> {
  useContentSettingsStore.getState().setSettings(await writeSettings(patch));
}
