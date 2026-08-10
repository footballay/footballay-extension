import type { FixtureSummary } from "@/domain/live-match/types";
import type { PageSessionSnapshot } from "@/shared/page-session";
import {
  addDaysToDateInputValue,
  getFixtureDateFromFixtures,
  getTodayDateInputValue
} from "../utils/date";
export type FixtureQuery = Pick<PageSessionSnapshot, "fixtureDate" | "fixtureLookupMode">;

// The fixture list always needs a query date; default to today's local date for first load.
export function getQueryDate(settings: FixtureQuery): string {
  return settings.fixtureDate ?? getTodayDateInputValue();
}

// The API searches from the adjacent date, not from the currently resolved match date itself.
// Previous uses yesterday + previous mode; next uses tomorrow + nearest mode.
export function getFixtureNavigationPatch(
  settings: FixtureQuery,
  direction: "previous" | "next"
): FixtureQuery {
  const baseDate = getQueryDate(settings);

  return {
    fixtureDate: addDaysToDateInputValue(baseDate, direction === "previous" ? -1 : 1),
    fixtureLookupMode: direction === "previous" ? "previous" : "nearest"
  };
}

export function getResolvedFixtureDatePatch(
  nextSettings: FixtureQuery,
  nextFixtures: FixtureSummary[] | null
): Pick<FixtureQuery, "fixtureDate"> | null {
  if (nextSettings.fixtureLookupMode === "exact" || !nextFixtures) {
    return null;
  }

  const resolvedDate = getFixtureDateFromFixtures(nextFixtures);
  if (!resolvedDate || resolvedDate === nextSettings.fixtureDate) {
    return null;
  }

  return { fixtureDate: resolvedDate };
}

// Exact date queries keep the requested date. Nearest/previous queries follow the date
// resolved by returned fixtures to avoid flickering and stale date labels.
export function resolveFixtureQuerySettingsPatch(
  nextSettings: FixtureQuery,
  nextFixtures: FixtureSummary[],
  requestedPatch: Partial<FixtureQuery>
): FixtureQuery {
  const resolvedDate =
    nextSettings.fixtureLookupMode === "exact"
      ? nextSettings.fixtureDate
      : getFixtureDateFromFixtures(nextFixtures) ?? nextSettings.fixtureDate;

  return {
    fixtureLookupMode: requestedPatch.fixtureLookupMode ?? nextSettings.fixtureLookupMode,
    ...requestedPatch,
    fixtureDate: resolvedDate
  };
}
