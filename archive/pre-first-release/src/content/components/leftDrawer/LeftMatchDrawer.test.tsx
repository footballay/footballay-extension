// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import { LeftMatchDrawer } from "./LeftMatchDrawer";

const data: LiveMatchOverlayData = {
  awayScore: 1,
  awayStats: {
    cornerKicks: 2,
    expectedGoals: "0.9",
    passesAccuracyPercentage: 79,
    possession: "45%",
    shotsOnGoal: 3,
    shotsTotal: 8
  },
  awayTeamName: "Away United",
  awayTeamColor: {
    primary: "#3050b8"
  },
  elapsed: 72,
  events: [
    {
      detail: "Yellow Card",
      elapsed: 68,
      extraTime: null,
      playerName: "Booked Player",
      sequence: 2,
      teamName: "Away United",
      type: "Card"
    },
    {
      assistName: "Creator",
      detail: "Normal Goal",
      elapsed: 24,
      extraTime: null,
      playerName: "Scorer",
      sequence: 1,
      teamName: "Home FC",
      type: "Goal"
    }
  ],
  fixtureUid: "fixture-1",
  homeScore: 2,
  homeStats: {
    cornerKicks: 5,
    expectedGoals: "1.8",
    passesAccuracyPercentage: 86,
    possession: "55%",
    shotsOnGoal: 6,
    shotsTotal: 13
  },
  homeTeamName: "Home FC",
  homeTeamColor: {
    primary: "#74112e"
  },
  statusShort: "2H",
  updatedAt: "2026-06-13T00:00:00.000Z"
};

afterEach(() => {
  cleanup();
});

describe("LeftMatchDrawer", () => {
  it("renders compact match summary, team stats, and event timeline", () => {
    const { container } = render(<LeftMatchDrawer data={data} />);

    expect(screen.getByRole("complementary", { name: "Match events and team stats" })).toBeTruthy();
    expect(screen.getByText("Home FC")).toBeTruthy();
    expect(screen.getByText("2 - 1")).toBeTruthy();
    expect(screen.getAllByText("Away United").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("72'")).toBeTruthy();
    expect(screen.getByText("Pass %")).toBeTruthy();
    expect(screen.getByText("Key stats")).toBeTruthy();
    expect(screen.getByText("xG")).toBeTruthy();
    expect(screen.getByText("1.8")).toBeTruthy();
    expect(screen.getByText("0.9")).toBeTruthy();
    expect(screen.getByText("Yellow card")).toBeTruthy();
    expect(screen.getByText("Booked Player")).toBeTruthy();
    expect(screen.getByText("Goal")).toBeTruthy();
    expect(screen.getByText("Scorer")).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders waiting and empty states without live data", () => {
    render(<LeftMatchDrawer data={null} />);

    expect(screen.getByText("Waiting for live data")).toBeTruthy();
    expect(screen.getByText("No stats")).toBeTruthy();
    expect(screen.getByText("No events")).toBeTruthy();
  });

  it("uses the left drawer shell modifier", () => {
    const { container } = render(<LeftMatchDrawer data={data} />);

    expect(container.querySelector(".footballay-side-drawer--left")).toBeTruthy();
    expect(container.querySelector(".footballay-left-drawer")).toBeTruthy();
  });
});
