// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { LiveMatchOverlayData, MatchEvent } from "@/domain/live-match/types";
import { MatchEventsTimeline } from "./MatchEventsTimeline";

afterEach(() => {
  cleanup();
});

describe("MatchEventsTimeline", () => {
  it("renders events in latest-first order with localized labels", () => {
    render(
      <MatchEventsTimeline
        data={createData([
          createEvent({ elapsed: 12, playerName: "Scorer", sequence: 1, type: "Goal", detail: "Normal Goal" }),
          createEvent({ elapsed: 67, playerName: "Booked", sequence: 2, type: "Card", detail: "Yellow Card" }),
          createEvent({ elapsed: 75, playerName: "Player in", assistName: "Player out", sequence: 3, type: "subst", detail: "Substitution 1" })
        ])}
      />
    );

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(rows[0]!.textContent).toContain("75'");
    expect(rows[0]!.textContent).toContain("Substitution");
    expect(rows[0]!.textContent).toContain("Player in");
    expect(rows[0]!.textContent).toContain("Player out");
    expect(rows[1]!.textContent).toContain("Yellow card");
    expect(rows[2]!.textContent).toContain("Goal");
  });

  it("renders card and goal marker variants", () => {
    const { container } = render(
      <MatchEventsTimeline
        data={createData([
          createEvent({ detail: "Red Card", type: "Card" }),
          createEvent({ detail: "Own Goal", sequence: 2, type: "Goal" })
        ])}
      />
    );

    expect(container.querySelector(".footballay-match-event--card")).toBeTruthy();
    expect(container.querySelector(".footballay-match-event__marker--red")).toBeTruthy();
    expect(container.querySelector(".footballay-match-event--goal")).toBeTruthy();
    expect(screen.getByText("Own goal")).toBeTruthy();
  });

  it("uses team name when player name is missing", () => {
    render(
      <MatchEventsTimeline
        data={createData([
          createEvent({ detail: "VAR check", playerName: undefined, teamName: "Home", type: "Var" })
        ])}
      />
    );

    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.getByText("VAR check")).toBeTruthy();
  });

  it("limits rendered events", () => {
    render(
      <MatchEventsTimeline
        data={createData([
          createEvent({ elapsed: 1, sequence: 1 }),
          createEvent({ elapsed: 2, sequence: 2 }),
          createEvent({ elapsed: 3, sequence: 3 })
        ])}
        limit={2}
      />
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders an empty state", () => {
    render(<MatchEventsTimeline data={createData([])} />);

    expect(screen.getByText("No events")).toBeTruthy();
  });
});

function createData(events: MatchEvent[]): LiveMatchOverlayData {
  return {
    awayScore: 0,
    awayTeamName: "Away",
    events,
    fixtureUid: "fixture-1",
    homeScore: 0,
    homeTeamName: "Home",
    updatedAt: "2026-06-13T00:00:00.000Z"
  };
}

function createEvent(overrides: Partial<MatchEvent>): MatchEvent {
  return {
    comments: null,
    detail: "Normal Goal",
    elapsed: 10,
    extraTime: null,
    playerName: "Player",
    sequence: 1,
    teamName: "Team",
    type: "Goal",
    ...overrides
  };
}
