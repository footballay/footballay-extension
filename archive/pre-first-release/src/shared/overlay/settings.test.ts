import { describe, expect, it } from "vitest";
import { defaultOverlayTickerStatKeys, defaultSettings, overlayTickerStatCatalog } from "@/shared/constants";
import { normalizeExtensionSettings, normalizeSettingsPatch } from "./settings";

describe("overlay settings normalization", () => {
  it("fills missing fields with defaults", () => {
    expect(
      normalizeExtensionSettings({
        extensionEnabled: false
      })
    ).toEqual({
      ...defaultSettings,
      extensionEnabled: false
    });
  });

  it("normalizes invalid overlay-only settings", () => {
    expect(
      normalizeExtensionSettings({
        overlayLanguage: "fr" as never,
        overlayPosition: "center" as never,
        overlayTickerIntervalMs: 100,
        overlayTickerScale: Number.NaN,
        overlayTickerStatsMode: "unknown" as never,
        overlayTickerCustomStatKeys: ["shotsOnGoal", "invalid", "shotsOnGoal"] as never
      })
    ).toMatchObject({
      overlayLanguage: defaultSettings.overlayLanguage,
      overlayPosition: defaultSettings.overlayPosition,
      overlayTickerIntervalMs: 1000,
      overlayTickerScale: defaultSettings.overlayTickerScale,
      overlayTickerStatsMode: "default",
      overlayTickerCustomStatKeys: ["shotsOnGoal"]
    });
  });

  it("pushes current default ticker stats into custom settings when no known stat list exists", () => {
    expect(
      normalizeExtensionSettings({
        overlayTickerStatsMode: "custom",
        overlayTickerCustomStatKeys: ["shotsTotal", "invalid"] as never
      }).overlayTickerCustomStatKeys
    ).toEqual([...defaultOverlayTickerStatKeys, "shotsTotal"]);
  });

  it("stores the latest stat catalog after normalization", () => {
    const settings = normalizeExtensionSettings({
      overlayTickerKnownStatKeys: ["possession"]
    });

    expect(settings.overlayTickerKnownStatKeys).toEqual(overlayTickerStatCatalog);
    expect(settings.overlayTickerKnownStatKeys).not.toBe(overlayTickerStatCatalog);
  });

  it("keeps default ticker stat mode independent from custom keys", () => {
    const settings = normalizeExtensionSettings({
      overlayTickerStatsMode: "default",
      overlayTickerCustomStatKeys: ["possession", "shotsOnGoal", "shotsTotal", "cards"]
    });

    expect(settings.overlayTickerStatsMode).toBe("default");
    expect(settings.overlayTickerCustomStatKeys).toEqual(["possession", "shotsOnGoal", "shotsTotal", "cards"]);
    expect(defaultOverlayTickerStatKeys).toEqual([
      "expectedGoals",
      "shotsOnGoal",
      "possession",
      "cornerKicks",
      "passesAccuracy",
      "cards"
    ]);
  });

  it("normalizes custom ticker stat keys and pushes newly discovered default stats", () => {
    expect(
      normalizeExtensionSettings({
        overlayTickerStatsMode: "custom",
        overlayTickerKnownStatKeys: ["possession", "shotsOnGoal", "cards"],
        overlayTickerCustomStatKeys: ["shotsTotal", "invalid", "possession", "shotsTotal"] as never
      }).overlayTickerCustomStatKeys
    ).toEqual(["expectedGoals", "cornerKicks", "passesAccuracy", "shotsTotal", "possession"]);
  });

  it("avoids duplicating newly discovered default stats already selected by the user", () => {
    expect(
      normalizeExtensionSettings({
        overlayTickerStatsMode: "custom",
        overlayTickerKnownStatKeys: ["possession", "shotsOnGoal", "cards"],
        overlayTickerCustomStatKeys: ["expectedGoals", "shotsTotal"]
      }).overlayTickerCustomStatKeys
    ).toEqual(["expectedGoals", "cornerKicks", "passesAccuracy", "shotsTotal"]);
  });

  it("does not re-add known default stats removed by the user", () => {
    expect(
      normalizeExtensionSettings({
        overlayTickerStatsMode: "custom",
        overlayTickerKnownStatKeys: [
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
        ],
        overlayTickerCustomStatKeys: ["shotsTotal", "possession"]
      }).overlayTickerCustomStatKeys
    ).toEqual(["shotsTotal", "possession"]);
  });

  it("falls back to an empty custom list when every custom key is invalid and all defaults are already known", () => {
    expect(
      normalizeExtensionSettings({
        overlayTickerStatsMode: "custom",
        overlayTickerKnownStatKeys: overlayTickerStatCatalog,
        overlayTickerCustomStatKeys: ["unknown", "bad"] as never
      }).overlayTickerCustomStatKeys
    ).toEqual([]);
  });

  it("converts nullable patch values to undefined", () => {
    expect(
      normalizeSettingsPatch({
        fixtureDate: null,
        selectedFixtureUid: "fixture-1"
      })
    ).toEqual({
      fixtureDate: undefined,
      selectedFixtureUid: "fixture-1"
    });
  });
});
