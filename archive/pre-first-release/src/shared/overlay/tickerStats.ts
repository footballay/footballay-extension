import { defaultOverlayTickerStatKeys, overlayTickerStatCatalog } from "@/shared/constants";
import type { ExtensionSettings, OverlayTickerStatKey } from "@/shared/overlay/types";

export function resolveOverlayTickerStatKeys(settings: ExtensionSettings): OverlayTickerStatKey[] {
  if (settings.overlayTickerStatsMode !== "custom") {
    return [...defaultOverlayTickerStatKeys];
  }

  return normalizeOverlayTickerStatKeys(settings.overlayTickerCustomStatKeys);
}

export function normalizeOverlayTickerStatKeys(value: unknown): OverlayTickerStatKey[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const validKeys = value.filter((key): key is OverlayTickerStatKey =>
    overlayTickerStatCatalog.includes(key as OverlayTickerStatKey)
  );

  return [...new Set(validKeys)];
}

export function mergeNewDefaultTickerStatKeys(
  customStatKeys: OverlayTickerStatKey[],
  knownStatKeys: OverlayTickerStatKey[]
): OverlayTickerStatKey[] {
  const newDefaultStatKeys = defaultOverlayTickerStatKeys.filter((key) => !knownStatKeys.includes(key));

  return [...new Set([...newDefaultStatKeys, ...customStatKeys])];
}
