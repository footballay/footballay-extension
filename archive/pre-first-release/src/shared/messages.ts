import type {
  AvailableLeagueResponse,
  FixtureByLeagueResponse,
  FixtureEventsResponse,
  FixtureInfoResponse,
  FixtureLineupResponse,
  FixtureLiveStatusResponse,
  FixtureStatisticsResponse
} from "@/domain/live-match/backendTypes";
import type { FixtureLookupMode } from "@/domain/live-match/types";

type Etagged<T> = { type: "updated"; data: T; etag?: string } | { type: "not-modified"; etag?: string };

export type RuntimeMessage =
  | { type: "GET_AVAILABLE_LEAGUES" }
  | { type: "GET_FIXTURES"; payload: { leagueUid: string; date?: string; mode: FixtureLookupMode; timezone: string } }
  | { type: "GET_FIXTURE_INFO"; payload: { fixtureUid: string } }
  | { type: "GET_FIXTURE_STATUS"; payload: { fixtureUid: string; etag?: string } }
  | { type: "GET_FIXTURE_STATISTICS"; payload: { fixtureUid: string; etag?: string } }
  | { type: "GET_FIXTURE_EVENTS"; payload: { fixtureUid: string; etag?: string } }
  | { type: "GET_FIXTURE_LINEUP"; payload: { fixtureUid: string; etag?: string } };

export type RuntimeResponse =
  | { ok: true; data: AvailableLeagueResponse[] | FixtureByLeagueResponse[] | FixtureInfoResponse | Etagged<FixtureLiveStatusResponse> | Etagged<FixtureStatisticsResponse> | Etagged<FixtureEventsResponse> | Etagged<FixtureLineupResponse> }
  | { ok: false; error: string };

export function sendRuntimeMessage<TResponse extends RuntimeResponse>(message: RuntimeMessage): Promise<TResponse> {
  return chrome.runtime.sendMessage(message) as Promise<TResponse>;
}
