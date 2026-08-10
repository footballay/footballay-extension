import { describe, expect, it } from "vitest";
import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import { buildTeamLineupViewModel, findLineupPlayer } from "./lineupViewModel";

const data: LiveMatchOverlayData = {
  awayScore: 0,
  awayTeamName: "Away",
  fixtureUid: "fixture-1",
  homeScore: 1,
  homeTeamName: "Home",
  lineup: {
    home: {
      formation: "4-3-3",
      players: [
        {
          grid: "1:1",
          matchPlayerUid: "starter-1",
          name: "Starter",
          number: 9,
          position: "F",
          rating: 7.1,
          substitute: false
        }
      ],
      substitutes: [
        {
          matchPlayerUid: "sub-1",
          name: "Sub",
          number: 19,
          position: "F",
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
      detail: "Normal Goal",
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
    }
  ],
  updatedAt: "2026-06-05T00:00:00.000Z"
};

describe("lineup view model", () => {
  it("nests substituted players under the outgoing player", () => {
    const lineup = buildTeamLineupViewModel(data, "home");
    const starter = lineup?.players[0];

    expect(starter?.playerSubstitute).toMatchObject({
      goals: 1,
      matchPlayerUid: "sub-1",
      name: "Sub",
      substitutedIn: true,
      yellowCards: 1
    });
  });

  it("finds nested substituted players recursively", () => {
    const lineup = buildTeamLineupViewModel(data, "home");

    expect(findLineupPlayer(lineup?.players ?? [], "sub-1")?.name).toBe("Sub");
  });

  it("groups players by grid row for formation rows", () => {
    const lineup = buildTeamLineupViewModel(
      {
        ...data,
        lineup: {
          home: {
            formation: "4-3-3",
            players: [
              { grid: "1:1", matchPlayerUid: "gk", name: "Keeper", number: 1, substitute: false },
              { grid: "2:1", matchPlayerUid: "lb", name: "Left", number: 3, substitute: false },
              { grid: "2:4", matchPlayerUid: "rb", name: "Right", number: 2, substitute: false },
              { matchPlayerUid: "unknown", name: "Unknown", number: 99, substitute: false }
            ],
            substitutes: [],
            teamName: "Home"
          }
        }
      },
      "home"
    );

    expect(lineup?.rows.map((row) => row.map((player) => player.matchPlayerUid))).toEqual([
      ["gk"],
      ["lb", "rb"],
      ["unknown"]
    ]);
  });
});
