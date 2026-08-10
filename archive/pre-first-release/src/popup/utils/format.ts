import type { AvailableLeague, FixtureSummary } from "@/domain/live-match/types";
import { getTodayDateInputValue } from "./date";

export function getLeagueLabel(league: AvailableLeague): string {
  return league.nameKo ?? league.name;
}

export function formatFixtureLabel(fixture: FixtureSummary): string {
  const score =
    fixture.homeScore !== null &&
    fixture.homeScore !== undefined &&
    fixture.awayScore !== null &&
    fixture.awayScore !== undefined
      ? ` ${fixture.homeScore}-${fixture.awayScore}`
      : "";
  const kickoff = fixture.kickoff ? ` ${new Date(fixture.kickoff).toLocaleDateString()}` : "";

  return `${fixture.homeTeamName} vs ${fixture.awayTeamName}${score}${kickoff}`;
}

export function formatSelectedDate(date?: string): string {
  const selectedDate = new Date(`${date ?? getTodayDateInputValue()}T00:00:00`);
  const month = selectedDate.getMonth() + 1;
  const day = selectedDate.getDate();
  const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(selectedDate);

  return `${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")} (${weekday})`;
}

export function formatKickoffTime(kickoff?: string | null): string {
  if (!kickoff) {
    return "--:--";
  }

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(kickoff));
}

export function formatFixtureScore(fixture: FixtureSummary): string {
  const homeScore = fixture.homeScore ?? "-";
  const awayScore = fixture.awayScore ?? "-";

  return `${homeScore}:${awayScore}`;
}

export function formatFixtureStatus(fixture: FixtureSummary): string {
  if (fixture.elapsed) {
    return `${fixture.elapsed}'`;
  }

  return fixture.statusShort;
}
