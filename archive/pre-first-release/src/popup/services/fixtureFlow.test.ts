import { describe, expect, it } from "vitest";
import type { FixtureSummary } from "@/domain/live-match/types";
import {
  getFixtureNavigationPatch,
  getQueryDate,
  resolveFixtureQuerySettingsPatch
} from "./fixtureFlow";

const fixture: FixtureSummary = {
  available: true,
  awayScore: null,
  awayTeamName: "Away",
  elapsed: null,
  homeScore: null,
  homeTeamName: "Home",
  kickoff: "2026-05-20T12:00:00.000Z",
  round: "Regular Season - 38",
  statusLong: "Not Started",
  statusShort: "NS",
  uid: "fixture-1"
};

describe("popup fixture flow", () => {
  it("returns configured query date or today fallback", () => {
    expect(getQueryDate({ fixtureDate: "2026-05-20", fixtureLookupMode: "nearest" })).toBe("2026-05-20");
    expect(getQueryDate({ fixtureLookupMode: "nearest" })).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("creates previous and next fixture navigation patches", () => {
    expect(
      getFixtureNavigationPatch(
        {
          fixtureLookupMode: "nearest",
          fixtureDate: "2026-05-20"
        },
        "previous"
      )
    ).toEqual({
      fixtureDate: "2026-05-19",
      fixtureLookupMode: "previous"
    });

    expect(
      getFixtureNavigationPatch(
        {
          fixtureLookupMode: "nearest",
          fixtureDate: "2026-05-20"
        },
        "next"
      )
    ).toEqual({
      fixtureDate: "2026-05-21",
      fixtureLookupMode: "nearest"
    });
  });

  it("keeps exact fixture date when resolving fixture query settings", () => {
    expect(
      resolveFixtureQuerySettingsPatch(
        {
          fixtureDate: "2026-05-22",
          fixtureLookupMode: "exact"
        },
        [fixture],
        {
          fixtureDate: "2026-05-22",
          fixtureLookupMode: "exact"
        }
      )
    ).toEqual({
      fixtureDate: "2026-05-22",
      fixtureLookupMode: "exact"
    });
  });

  it("uses resolved fixture date for nearest and previous query modes", () => {
    expect(
      resolveFixtureQuerySettingsPatch(
        {
          fixtureDate: "2026-05-21",
          fixtureLookupMode: "nearest"
        },
        [fixture],
        {
          fixtureDate: "2026-05-21",
          fixtureLookupMode: "nearest"
        }
      )
    ).toEqual({
      fixtureDate: "2026-05-20",
      fixtureLookupMode: "nearest"
    });
  });
});
