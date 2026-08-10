export type OverlayPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "bottom-center";

export type OverlayLanguage = "auto" | "ko" | "en";

export type OverlayTickerStatsMode = "default" | "custom";

export type OverlayTickerStatKey =
  | "expectedGoals"
  | "possession"
  | "shotsOnGoal"
  | "shotsTotal"
  | "shotsInsideBox"
  | "cornerKicks"
  | "passesAccuracy"
  | "fouls"
  | "offsides"
  | "goalkeeperSaves"
  | "cards";

export type ExtensionSettings = {
  extensionEnabled: boolean;
  overlayLanguage: OverlayLanguage;
  overlayPosition: OverlayPosition;
  overlayTickerIntervalMs: number;
  overlayTickerScale: number;
  overlayTickerStatsMode: OverlayTickerStatsMode;
  overlayTickerCustomStatKeys: OverlayTickerStatKey[];
  overlayTickerKnownStatKeys: OverlayTickerStatKey[];
  pollingIntervalMs: number;
};
