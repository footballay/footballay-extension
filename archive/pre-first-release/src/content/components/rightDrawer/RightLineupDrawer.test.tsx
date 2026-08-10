// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import { RightLineupDrawer } from "./RightLineupDrawer";

const data: LiveMatchOverlayData = {
  awayScore: 1,
  awayTeamName: "Away",
  fixtureUid: "fixture-1",
  homeScore: 2,
  homeTeamName: "Home",
  lineup: {
    home: {
      formation: "4-3-3",
      players: [
        {
          goals: 1,
          grid: "1:3",
          matchPlayerUid: "starter-1",
          name: "Starter",
          number: 9,
          position: "F",
          rating: 7.4,
          substitute: false
        }
      ],
      substitutes: [
        {
          assists: 1,
          duelsTotal: 7,
          duelsWon: 4,
          foulsCommitted: 2,
          foulsDrawn: 3,
          interceptions: 1,
          minutesPlayed: 30,
          matchPlayerUid: "sub-1",
          name: "Sub",
          number: 19,
          passesAccuracy: 12,
          passesKey: 2,
          passesTotal: 16,
          position: "F",
          shots: 3,
          shotsOn: 2,
          substitute: true
        }
      ],
      teamName: "Home"
    }
  },
  events: [
    {
      assistMatchPlayerUid: "starter-1",
      assistName: "Starter",
      detail: "Substitution 1",
      elapsed: 60,
      playerMatchPlayerUid: "sub-1",
      playerName: "Sub",
      sequence: 1,
      teamName: "Home",
      type: "subst"
    },
    {
      detail: "Own Goal",
      elapsed: 70,
      playerMatchPlayerUid: "sub-1",
      playerName: "Sub",
      sequence: 2,
      teamName: "Home",
      type: "Goal"
    },
    {
      detail: "Yellow Card",
      elapsed: 75,
      playerMatchPlayerUid: "sub-1",
      playerName: "Sub",
      sequence: 3,
      teamName: "Home",
      type: "Card"
    },
    {
      detail: "Red Card",
      elapsed: 80,
      playerMatchPlayerUid: "sub-1",
      playerName: "Sub",
      sequence: 4,
      teamName: "Home",
      type: "Card"
    }
  ],
  updatedAt: "2026-06-05T00:00:00.000Z"
};

afterEach(() => {
  cleanup();
});

describe("RightLineupDrawer", () => {
  it("renders lineup players without image assets", async () => {
    const user = userEvent.setup();
    const onSelectPlayer = vi.fn();

    render(
      <RightLineupDrawer
        data={data}
        onClearSelectedPlayer={vi.fn()}
        onSelectPlayer={onSelectPlayer}
      />
    );

    expect(screen.getByRole("complementary", { name: "Lineup" })).toBeTruthy();
    expect(screen.queryByText("Lineup")).toBeNull();
    expect(screen.queryByText("Home 2 - 1 Away")).toBeNull();
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.getByText("4-3-3")).toBeTruthy();
    expect(screen.getByText("Sub")).toBeTruthy();
    expect(screen.getByLabelText("Substituted in")).toBeTruthy();
    expect(screen.getByLabelText("Own goal")).toBeTruthy();
    expect(screen.getByLabelText("Red card")).toBeTruthy();
    expect(screen.queryByLabelText("Yellow card")).toBeNull();

    await user.click(screen.getByRole("button", { name: /Sub/ }));

    expect(onSelectPlayer).toHaveBeenCalledWith("sub-1");
  });

  it("renders an empty state when lineup is unavailable", () => {
    render(<RightLineupDrawer data={null} onClearSelectedPlayer={vi.fn()} onSelectPlayer={vi.fn()} />);

    expect(screen.getByText("No lineup")).toBeTruthy();
  });

  it("renders selected player details as an overlay", async () => {
    const user = userEvent.setup();
    const onClearSelectedPlayer = vi.fn();

    render(
      <RightLineupDrawer
        data={data}
        selectedPlayerUid="sub-1"
        onClearSelectedPlayer={onClearSelectedPlayer}
        onSelectPlayer={vi.fn()}
      />
    );

    expect(screen.getByRole("dialog", { name: "Sub" })).toBeTruthy();
    expect(screen.getByText("#19")).toBeTruthy();
    expect(screen.getByText("Minutes")).toBeTruthy();
    expect(screen.getByText("30")).toBeTruthy();
    expect(screen.getByText("Key passes")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("Duels")).toBeTruthy();
    expect(screen.getByText("4/7")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Close player details" }));

    expect(onClearSelectedPlayer).toHaveBeenCalledTimes(1);
  });
});
