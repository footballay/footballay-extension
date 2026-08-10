import type { FixtureLookupMode } from "@/domain/live-match/types";

export type StreamingSite = "coupang-play" | "spotv-now";

export type PageIdentity = {
  /** Temporary pathname fallback until a StreamingSiteAdapter extracts a verified content id. */
  contentId: string;
  site: StreamingSite;
};

export type OverlayDrawerSide = "left" | "right";

export type PageSessionSnapshot = {
  fixtureLookupMode: FixtureLookupMode;
  overlayCollapsed: boolean;
  overlayVisible: boolean;
  fixtureDate?: string;
  selectedDrawerSide?: OverlayDrawerSide;
  selectedFixtureDate?: string;
  selectedFixtureUid?: string;
  selectedLeagueUid?: string;
  selectedPlayerUid?: string;
};

export const defaultPageSessionSnapshot: PageSessionSnapshot = {
  fixtureLookupMode: "nearest",
  overlayCollapsed: true,
  overlayVisible: true
};

export function getPageSessionKey(identity: PageIdentity): string {
  return `${identity.site}:${identity.contentId}`;
}
