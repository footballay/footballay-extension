import type { MatchEvent } from "@/domain/live-match/types";
import type { MessageKey } from "@/shared/i18n/messages";

export type MatchEventVariant = "goal" | "card" | "substitution" | "default";

export type MatchEventViewItem = {
  cardColor?: "red" | "yellow";
  fallbackLabel: string;
  id: string;
  labelKey?: MessageKey;
  minuteLabel: string;
  primaryText: string;
  secondaryText?: string;
  teamName: string;
  variant: MatchEventVariant;
};

export function buildMatchEventViewItems(events: MatchEvent[] = []): MatchEventViewItem[] {
  return [...events]
    .sort(compareEventsByLatestFirst)
    .map((event) => ({
      cardColor: getCardColor(event),
      fallbackLabel: getFallbackLabel(event),
      id: getEventId(event),
      labelKey: getLabelKey(event),
      minuteLabel: formatMinute(event),
      primaryText: event.playerName ?? event.teamName,
      secondaryText: getSecondaryText(event),
      teamName: event.teamName,
      variant: getVariant(event)
    }));
}

function compareEventsByLatestFirst(left: MatchEvent, right: MatchEvent): number {
  return (
    right.elapsed - left.elapsed ||
    (right.extraTime ?? 0) - (left.extraTime ?? 0) ||
    right.sequence - left.sequence
  );
}

function formatMinute(event: MatchEvent): string {
  return event.extraTime ? `${event.elapsed}+${event.extraTime}'` : `${event.elapsed}'`;
}

function getEventId(event: MatchEvent): string {
  return [
    event.sequence,
    event.elapsed,
    event.extraTime ?? 0,
    event.type,
    event.detail,
    event.playerMatchPlayerUid ?? event.playerName ?? "",
    event.teamName
  ].join("-");
}

function getVariant(event: MatchEvent): MatchEventVariant {
  if (isGoalEvent(event)) {
    return "goal";
  }

  if (isCardEvent(event)) {
    return "card";
  }

  if (isSubstitutionEvent(event)) {
    return "substitution";
  }

  return "default";
}

function getLabelKey(event: MatchEvent): MessageKey | undefined {
  if (isOwnGoalEvent(event)) {
    return "content.drawer.event.ownGoal";
  }

  if (isGoalEvent(event)) {
    return "content.drawer.event.goal";
  }

  if (isRedCardEvent(event)) {
    return "content.drawer.event.redCard";
  }

  if (isYellowCardEvent(event)) {
    return "content.drawer.event.yellowCard";
  }

  if (isSubstitutionEvent(event)) {
    return "content.drawer.event.substitution";
  }

  return undefined;
}

function getFallbackLabel(event: MatchEvent): string {
  return event.detail || event.type;
}

function getSecondaryText(event: MatchEvent): string | undefined {
  if (isSubstitutionEvent(event) && event.assistName) {
    return event.assistName;
  }

  if (isGoalEvent(event) && event.assistName) {
    return event.assistName;
  }

  return event.playerName ? event.teamName : undefined;
}

function getCardColor(event: MatchEvent): MatchEventViewItem["cardColor"] {
  if (isRedCardEvent(event)) {
    return "red";
  }

  if (isYellowCardEvent(event)) {
    return "yellow";
  }

  return undefined;
}

function isGoalEvent(event: MatchEvent): boolean {
  return event.type.toLowerCase() === "goal";
}

function isOwnGoalEvent(event: MatchEvent): boolean {
  return isGoalEvent(event) && event.detail.toLowerCase().includes("own");
}

function isCardEvent(event: MatchEvent): boolean {
  return event.type.toLowerCase().includes("card");
}

function isYellowCardEvent(event: MatchEvent): boolean {
  return isCardEvent(event) && event.detail.toLowerCase().includes("yellow");
}

function isRedCardEvent(event: MatchEvent): boolean {
  return isCardEvent(event) && event.detail.toLowerCase().includes("red");
}

function isSubstitutionEvent(event: MatchEvent): boolean {
  return event.type.toLowerCase().includes("subst") || event.detail.toLowerCase().includes("subst");
}
