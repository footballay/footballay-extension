import { describe, expect, it } from "vitest";
import type { MatchEvent } from "@/domain/live-match/types";
import { buildMatchEventViewItems } from "./matchEventViewModel";

describe("matchEventViewModel", () => {
  it("sorts events by latest elapsed time, extra time, and sequence", () => {
    const items = buildMatchEventViewItems([
      createEvent({ elapsed: 45, extraTime: 1, sequence: 2, type: "Card" }),
      createEvent({ elapsed: 46, sequence: 3, type: "Goal" }),
      createEvent({ elapsed: 45, extraTime: 2, sequence: 1, type: "subst" })
    ]);

    expect(items.map((item) => item.minuteLabel)).toEqual(["46'", "45+2'", "45+1'"]);
  });

  it("builds goal and own goal view items", () => {
    const [goal, ownGoal] = buildMatchEventViewItems([
      createEvent({ detail: "Normal Goal", playerName: "Scorer", assistName: "Creator", type: "Goal" }),
      createEvent({ detail: "Own Goal", playerName: "Defender", type: "Goal", sequence: 2 })
    ]);

    expect(goal).toMatchObject({
      labelKey: "content.drawer.event.ownGoal",
      primaryText: "Defender",
      variant: "goal"
    });
    expect(ownGoal).toMatchObject({
      labelKey: "content.drawer.event.goal",
      primaryText: "Scorer",
      secondaryText: "Creator",
      variant: "goal"
    });
  });

  it("builds card view items with the strongest card color", () => {
    const [redCard, yellowCard] = buildMatchEventViewItems([
      createEvent({ detail: "Yellow Card", playerName: "Booked", type: "Card" }),
      createEvent({ detail: "Red Card", playerName: "Sent off", sequence: 2, type: "Card" })
    ]);

    expect(redCard).toMatchObject({
      cardColor: "red",
      labelKey: "content.drawer.event.redCard",
      primaryText: "Sent off",
      variant: "card"
    });
    expect(yellowCard).toMatchObject({
      cardColor: "yellow",
      labelKey: "content.drawer.event.yellowCard",
      primaryText: "Booked",
      variant: "card"
    });
  });

  it("builds substitution view items and falls back to team text", () => {
    const [item] = buildMatchEventViewItems([
      createEvent({
        assistName: "Player out",
        detail: "Substitution 1",
        playerName: undefined,
        teamName: "Home",
        type: "subst"
      })
    ]);

    expect(item).toMatchObject({
      labelKey: "content.drawer.event.substitution",
      primaryText: "Home",
      secondaryText: "Player out",
      teamName: "Home",
      variant: "substitution"
    });
  });

  it("keeps unknown events as default items with fallback labels", () => {
    const [item] = buildMatchEventViewItems([
      createEvent({ detail: "VAR check", playerName: undefined, type: "Var" })
    ]);

    expect(item).toMatchObject({
      fallbackLabel: "VAR check",
      labelKey: undefined,
      primaryText: "Team",
      secondaryText: undefined,
      variant: "default"
    });
  });

  it("handles an empty event list", () => {
    expect(buildMatchEventViewItems()).toEqual([]);
  });
});

function createEvent(overrides: Partial<MatchEvent>): MatchEvent {
  return {
    comments: null,
    detail: "Normal",
    elapsed: 10,
    extraTime: null,
    playerName: "Player",
    sequence: 1,
    teamName: "Team",
    type: "Goal",
    ...overrides
  };
}
