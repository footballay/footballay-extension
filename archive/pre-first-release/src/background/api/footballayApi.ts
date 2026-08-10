import axios from "axios";
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

const footballayApi = axios.create({
  baseURL: import.meta.env.VITE_FOOTBALLAY_API_BASE_URL?.trim() || "https://api.footballay.com",
  headers: { Accept: "application/json" }
});

export type EtaggedResponse<T> =
  | { type: "updated"; data: T; etag?: string }
  | { type: "not-modified"; etag?: string };

export type FixtureQuery = { date?: string; mode: FixtureLookupMode; timezone: string };

export function getAvailableLeagues(): Promise<AvailableLeagueResponse[]> {
  return getJson("/v1/football/leagues/available");
}

export function getFixtures(leagueUid: string, query: FixtureQuery): Promise<FixtureByLeagueResponse[]> {
  const parameters = new URLSearchParams({ mode: query.mode, timezone: query.timezone });
  if (query.date) parameters.set("date", query.date);
  return getJson(`/v1/football/leagues/${encodeURIComponent(leagueUid)}/fixtures?${parameters}`);
}

export function getFixtureInfo(fixtureUid: string): Promise<FixtureInfoResponse> {
  return getJson(`/v1/football/fixtures/${encodeURIComponent(fixtureUid)}/info`);
}

export function getFixtureStatus(fixtureUid: string, etag?: string): Promise<EtaggedResponse<FixtureLiveStatusResponse>> {
  return getEtaggedJson(`/v1/football/fixtures/${encodeURIComponent(fixtureUid)}/status`, etag);
}

export function getFixtureStatistics(fixtureUid: string, etag?: string): Promise<EtaggedResponse<FixtureStatisticsResponse>> {
  return getEtaggedJson(`/v1/football/fixtures/${encodeURIComponent(fixtureUid)}/statistics`, etag);
}

export function getFixtureEvents(fixtureUid: string, etag?: string): Promise<EtaggedResponse<FixtureEventsResponse>> {
  return getEtaggedJson(`/v1/football/fixtures/${encodeURIComponent(fixtureUid)}/events`, etag);
}

export function getFixtureLineup(fixtureUid: string, etag?: string): Promise<EtaggedResponse<FixtureLineupResponse>> {
  return getEtaggedJson(`/v1/football/fixtures/${encodeURIComponent(fixtureUid)}/lineup`, etag);
}

function getJson<T>(path: string): Promise<T> {
  return footballayApi.get<T>(path).then((response) => response.data);
}

function getEtaggedJson<T>(path: string, etag?: string): Promise<EtaggedResponse<T>> {
  return footballayApi.get<T>(path, {
    headers: etag ? { "If-None-Match": etag } : undefined,
    validateStatus: (status) => (status >= 200 && status < 300) || status === 304
  }).then((response) => {
    const nextEtag = getResponseHeader(response.headers, "etag");
    return response.status === 304
      ? { type: "not-modified", etag: nextEtag }
      : { type: "updated", data: response.data, etag: nextEtag };
  });
}

function getResponseHeader(headers: unknown, name: string): string | undefined {
  if (!headers || typeof headers !== "object") return undefined;
  const value = (headers as { get?: (key: string) => unknown; [key: string]: unknown }).get?.(name)
    ?? (headers as Record<string, unknown>)[name.toLowerCase()]
    ?? (headers as Record<string, unknown>)[name];
  if (Array.isArray(value)) return value[0] === undefined ? undefined : String(value[0]);
  return value === undefined || value === null ? undefined : String(value);
}
