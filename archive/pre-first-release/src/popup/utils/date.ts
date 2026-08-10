import type { FixtureSummary } from "@/domain/live-match/types";

export function getTodayDateInputValue(): string {
  const date = new Date();
  return toDateInputValue(date);
}

export function getFixtureDateFromFixtures(fixtures: FixtureSummary[]): string | undefined {
  const kickoff = fixtures.find((fixture) => fixture.kickoff)?.kickoff;
  if (!kickoff) {
    return undefined;
  }

  return toDateInputValue(new Date(kickoff));
}

export function getFixtureDate(fixture: FixtureSummary): string | undefined {
  if (!fixture.kickoff) {
    return undefined;
  }

  return toDateInputValue(new Date(fixture.kickoff));
}

export function toDateInputValue(date: Date): string {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

export function addDaysToDateInputValue(dateInputValue: string, days: number): string {
  const date = new Date(`${dateInputValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}
