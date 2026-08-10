import { describe, expect, it } from "vitest";
import { defaultOverlayTickerStatKeys } from "@/shared/constants";
import type { ExtensionSettings } from "@/shared/overlay/types";
import {
  mergeNewDefaultTickerStatKeys,
  normalizeOverlayTickerStatKeys,
  resolveOverlayTickerStatKeys
} from "./tickerStats";

describe("overlay ticker stat helpers", () => {
  it("normalizes unknown values to an empty stat list", () => {
    expect(normalizeOverlayTickerStatKeys(undefined)).toEqual([]);
    expect(normalizeOverlayTickerStatKeys(null)).toEqual([]);
    expect(normalizeOverlayTickerStatKeys("possession")).toEqual([]);
    expect(normalizeOverlayTickerStatKeys({ 0: "possession" })).toEqual([]);
  });

  it("keeps only supported stat keys and removes duplicates without reordering", () => {
    expect(
      normalizeOverlayTickerStatKeys([
        "shotsTotal",
        "invalid",
        "possession",
        "shotsTotal",
        1,
        false,
        "cards"
      ])
    ).toEqual(["shotsTotal", "possession", "cards"]);
  });

  it("resolves default mode from the current default stat list", () => {
    const settings = {
      overlayTickerStatsMode: "default",
      overlayTickerCustomStatKeys: ["shotsTotal"]
    } as ExtensionSettings;

    expect(resolveOverlayTickerStatKeys(settings)).toEqual(defaultOverlayTickerStatKeys);
  });

  it("returns a copy of the default stat list", () => {
    const settings = {
      overlayTickerStatsMode: "default",
      overlayTickerCustomStatKeys: []
    } as unknown as ExtensionSettings;
    const resolved = resolveOverlayTickerStatKeys(settings);

    resolved.pop();

    expect(resolveOverlayTickerStatKeys(settings)).toEqual(defaultOverlayTickerStatKeys);
  });

  it("resolves custom mode from the normalized custom stat list", () => {
    const settings = {
      overlayTickerStatsMode: "custom",
      overlayTickerCustomStatKeys: ["shotsTotal", "invalid", "shotsTotal", "possession"]
    } as unknown as ExtensionSettings;

    expect(resolveOverlayTickerStatKeys(settings)).toEqual(["shotsTotal", "possession"]);
  });

  it("prepends only newly discovered default stats to custom stat lists", () => {
    expect(
      mergeNewDefaultTickerStatKeys(
        ["shotsTotal", "possession"],
        ["expectedGoals", "shotsOnGoal", "cards"]
      )
    ).toEqual(["possession", "cornerKicks", "passesAccuracy", "shotsTotal"]);
  });

  it("does not duplicate a new default stat already present in the custom list", () => {
    expect(
      mergeNewDefaultTickerStatKeys(
        ["expectedGoals", "shotsTotal"],
        ["possession", "shotsOnGoal", "cards"]
      )
    ).toEqual(["expectedGoals", "cornerKicks", "passesAccuracy", "shotsTotal"]);
  });

  it("does not re-add default stats that are already known but intentionally removed", () => {
    expect(
      mergeNewDefaultTickerStatKeys(
        ["shotsTotal"],
        [...defaultOverlayTickerStatKeys, "shotsTotal"]
      )
    ).toEqual(["shotsTotal"]);
  });
});
