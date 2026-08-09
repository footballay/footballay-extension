import type { ExtensionSettings, OverlayTickerStatKey } from "@/shared/overlay/types";

export const defaultOverlayTickerStatKeys: OverlayTickerStatKey[] = [
  "expectedGoals",
  "shotsOnGoal",
  "possession",
  "cornerKicks",
  "passesAccuracy",
  "cards"
];

export const overlayTickerStatCatalog: OverlayTickerStatKey[] = [
  "expectedGoals",
  "possession",
  "shotsOnGoal",
  "shotsTotal",
  "shotsInsideBox",
  "cornerKicks",
  "passesAccuracy",
  "fouls",
  "offsides",
  "goalkeeperSaves",
  "cards"
];

export const defaultSettings: ExtensionSettings = {
  extensionEnabled: true,
  overlayLanguage: "auto",
  overlayPosition: "bottom-right",
  overlayTickerIntervalMs: 7000,
  overlayTickerScale: 1,
  overlayTickerStatsMode: "default",
  overlayTickerCustomStatKeys: [],
  overlayTickerKnownStatKeys: overlayTickerStatCatalog,
  pollingIntervalMs: 5000
};

export const supportedStreamingMatches = [
  "https://www.coupangplay.com/*",
  "https://www.spotvnow.co.kr/*"
];

export const supportedStreamingHosts = ["www.coupangplay.com", "www.spotvnow.co.kr"];
