import { describe, expect, it } from "vitest";
import type { AvailableLeague, FixtureSummary } from "@/domain/live-match/types";
import {
  formatFixtureLabel,
  formatFixtureScore,
  formatFixtureStatus,
  formatSelectedDate,
  getLeagueLabel
} from "./format";

describe("popup format utils", () => {
  it("prefers Korean league name when available", () => {
    expect(getLeagueLabel({ uid: "league-1", name: "Premier League", nameKo: "프리미어리그" })).toBe(
      "프리미어리그"
    );
    expect(getLeagueLabel({ uid: "league-2", name: "World Cup" } as AvailableLeague)).toBe("World Cup");
  });

  it("formats fixture labels with score when both scores are present", () => {
    const fixture = createFixture({
      homeScore: 2,
      awayScore: 1
    });

    expect(formatFixtureLabel(fixture)).toContain("Home vs Away 2-1");
  });

  it("formats fixture score with placeholders for missing scores", () => {
    expect(formatFixtureScore(createFixture({ homeScore: 0, awayScore: 3 }))).toBe("0:3");
    expect(formatFixtureScore(createFixture({ homeScore: null, awayScore: undefined }))).toBe("-:-");
  });

  it("formats fixture status with elapsed time when available", () => {
    expect(formatFixtureStatus(createFixture({ elapsed: 68, statusShort: "2H" }))).toBe("68'");
    expect(formatFixtureStatus(createFixture({ elapsed: null, statusShort: "NS" }))).toBe("NS");
  });

  it("formats selected date", () => {
    expect(formatSelectedDate("2026-05-25")).toBe("05.25 (월)");
  });
});

function createFixture(patch: Partial<FixtureSummary> = {}): FixtureSummary {
  return {
    available: true,
    awayTeamName: "Away",
    kickoff: "2026-05-25T10:00:00Z",
    homeTeamName: "Home",
    round: "Regular Season - 1",
    statusLong: "Match Finished",
    statusShort: "FT",
    uid: "fixture-1",
    ...patch
  };
}
