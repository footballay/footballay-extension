import { defaultSettings, overlayTickerStatCatalog } from "@/shared/constants";
import { overlayPositions } from "@/shared/overlay/position";
import { mergeNewDefaultTickerStatKeys, normalizeOverlayTickerStatKeys } from "@/shared/overlay/tickerStats";
import type { ExtensionSettings, OverlayLanguage } from "@/shared/overlay/types";

const overlayLanguages: OverlayLanguage[] = ["auto", "ko", "en"];
const overlayTickerStatsModes: ExtensionSettings["overlayTickerStatsMode"][] = ["default", "custom"];

export function normalizeExtensionSettings(
  rawSettings: Partial<ExtensionSettings> | null | undefined
): ExtensionSettings {
  const raw = rawSettings ?? {};
  const overlayTickerStatsMode = overlayTickerStatsModes.includes(raw.overlayTickerStatsMode as ExtensionSettings["overlayTickerStatsMode"])
    ? (raw.overlayTickerStatsMode as ExtensionSettings["overlayTickerStatsMode"])
    : defaultSettings.overlayTickerStatsMode;
  const overlayTickerKnownStatKeys = normalizeOverlayTickerStatKeys(raw.overlayTickerKnownStatKeys);
  const normalizedCustomStatKeys = normalizeOverlayTickerStatKeys(raw.overlayTickerCustomStatKeys);
  const overlayTickerCustomStatKeys =
    overlayTickerStatsMode === "custom"
      ? mergeNewDefaultTickerStatKeys(normalizedCustomStatKeys, overlayTickerKnownStatKeys)
      : normalizedCustomStatKeys;
  const nextSettings: ExtensionSettings = {
    extensionEnabled: getBoolean(raw.extensionEnabled, defaultSettings.extensionEnabled),
    overlayLanguage: overlayLanguages.includes(raw.overlayLanguage as OverlayLanguage)
      ? (raw.overlayLanguage as OverlayLanguage)
      : defaultSettings.overlayLanguage,
    overlayPosition: overlayPositions.includes(raw.overlayPosition as ExtensionSettings["overlayPosition"])
      ? (raw.overlayPosition as ExtensionSettings["overlayPosition"])
      : defaultSettings.overlayPosition,
    overlayTickerIntervalMs: clampNumber(
      raw.overlayTickerIntervalMs,
      defaultSettings.overlayTickerIntervalMs,
      1000,
      60000
    ),
    overlayTickerScale: clampNumber(raw.overlayTickerScale, defaultSettings.overlayTickerScale, 0.75, 2.5),
    overlayTickerStatsMode,
    overlayTickerCustomStatKeys,
    overlayTickerKnownStatKeys: [...overlayTickerStatCatalog],
    pollingIntervalMs: clampNumber(raw.pollingIntervalMs, defaultSettings.pollingIntervalMs, 5000, 300000)
  };

  return nextSettings;
}

export function normalizeSettingsPatch(
  patch: Record<string, unknown>
): Partial<ExtensionSettings> {
  return Object.fromEntries(
    Object.entries(patch).map(([key, value]) => [key, value === null ? undefined : value])
  ) as Partial<ExtensionSettings>;
}

function getBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(value, min), max);
}
