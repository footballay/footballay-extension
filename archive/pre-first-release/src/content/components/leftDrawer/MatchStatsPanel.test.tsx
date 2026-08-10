// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import { MatchStatsPanel } from "./MatchStatsPanel";

const matchData: LiveMatchOverlayData = {
  awayScore: 0,
  awayStats: {
    cornerKicks: 2,
    expectedGoals: "0.8",
    fouls: 12,
    goalkeeperSaves: 4,
    offsides: 1,
    passesAccuracyPercentage: 79,
    possession: "44%",
    shotsInsideBox: 4,
    shotsOnGoal: 3,
    shotsTotal: 9,
    yellowCards: 2
  },
  awayTeamName: "Away",
  awayTeamColor: {
    primary: "#3050b8"
  },
  fixtureUid: "fixture-1",
  homeScore: 2,
  homeStats: {
    cornerKicks: 6,
    expectedGoals: "1.7",
    fouls: 8,
    goalkeeperSaves: 1,
    offsides: 3,
    passesAccuracyPercentage: 86,
    possession: "56%",
    redCards: 1,
    shotsInsideBox: 8,
    shotsOnGoal: 6,
    shotsTotal: 14,
    yellowCards: 1
  },
  homeTeamName: "Home",
  homeTeamColor: {
    primary: "#74112e"
  },
  updatedAt: "2026-06-05T00:00:00.000Z"
};

afterEach(() => {
  cleanup();
});

describe("MatchStatsPanel", () => {
  it("renders pass accuracy donuts and ratio bars from live match data", () => {
    const { container } = render(<MatchStatsPanel data={matchData} />);

    expect(screen.getByText("Pass %")).toBeTruthy();
    expect(screen.getByText("86%")).toBeTruthy();
    expect(screen.getByText("79%")).toBeTruthy();
    expect(screen.getByText("Key stats")).toBeTruthy();
    expect(screen.getByText("xG")).toBeTruthy();
    expect(screen.getByText("1.7")).toBeTruthy();
    expect(screen.getByText("0.8")).toBeTruthy();
    expect(screen.getByText("Corners")).toBeTruthy();
    expect(screen.getAllByText("6")).toBeTruthy();
    expect(screen.getByText("Yellow cards")).toBeTruthy();
    expect(screen.getByText("Red cards")).toBeTruthy();
    expect((container.querySelector(".footballay-visual-stats") as HTMLElement).style.getPropertyValue("--footballay-home-color")).toBe("#74112e");
    expect((container.querySelector(".footballay-visual-stats") as HTMLElement).style.getPropertyValue("--footballay-away-color")).toBe("#3050b8");
  });

  it("renders an empty state when no stats are available", () => {
    render(<MatchStatsPanel data={null} />);

    expect(screen.getByText("No stats")).toBeTruthy();
  });
});
