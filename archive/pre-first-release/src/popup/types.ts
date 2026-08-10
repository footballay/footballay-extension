import type { PageSessionSnapshot } from "@/shared/page-session";

export type FixtureDateDirection = "previous" | "next";
export type FixtureQueryPatch = Partial<Pick<PageSessionSnapshot, "fixtureDate" | "fixtureLookupMode">>;
export type PopupTab = "fixtures" | "settings";
