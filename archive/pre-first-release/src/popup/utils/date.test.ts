import { describe, expect, it } from "vitest";
import type { FixtureSummary } from "@/domain/live-match/types";
import {
  addDaysToDateInputValue,
  getFixtureDateFromFixtures,
  toDateInputValue
} from "./date";

describe("popup date utils", () => {
  it("formats a Date as a date input value", () => {
    expect(toDateInputValue(new Date("2026-05-25T15:30:00"))).toBe("2026-05-25");
  });

  it("adds days to a date input value", () => {
    expect(addDaysToDateInputValue("2026-05-25", -1)).toBe("2026-05-24");
    expect(addDaysToDateInputValue("2026-05-25", 1)).toBe("2026-05-26");
  });

  it("returns the first fixture kickoff date", () => {
    const fixtures = [
      { uid: "fixture-empty", kickoff: null },
      { uid: "fixture-1", kickoff: "2026-05-20T10:30:00Z" }
    ] as FixtureSummary[];

    expect(getFixtureDateFromFixtures(fixtures)).toBe("2026-05-20");
  });

  it("returns undefined when fixtures have no kickoff", () => {
    const fixtures = [{ uid: "fixture-empty", kickoff: null }] as FixtureSummary[];

    expect(getFixtureDateFromFixtures(fixtures)).toBeUndefined();
  });
});
