import * as footballayApi from "./footballayApi";
import type { RuntimeMessage, RuntimeResponse } from "@/shared/messages";

export async function handleApiRequest(message: unknown): Promise<RuntimeResponse> {
  if (!isRuntimeMessage(message)) return { ok: false, error: "Invalid Footballay API request" };
  try {
    switch (message.type) {
      case "GET_AVAILABLE_LEAGUES": return { ok: true, data: await footballayApi.getAvailableLeagues() };
      case "GET_FIXTURES": return { ok: true, data: await footballayApi.getFixtures(message.payload.leagueUid, message.payload) };
      case "GET_FIXTURE_INFO": return { ok: true, data: await footballayApi.getFixtureInfo(message.payload.fixtureUid) };
      case "GET_FIXTURE_STATUS": return { ok: true, data: await footballayApi.getFixtureStatus(message.payload.fixtureUid, message.payload.etag) };
      case "GET_FIXTURE_STATISTICS": return { ok: true, data: await footballayApi.getFixtureStatistics(message.payload.fixtureUid, message.payload.etag) };
      case "GET_FIXTURE_EVENTS": return { ok: true, data: await footballayApi.getFixtureEvents(message.payload.fixtureUid, message.payload.etag) };
      case "GET_FIXTURE_LINEUP": return { ok: true, data: await footballayApi.getFixtureLineup(message.payload.fixtureUid, message.payload.etag) };
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Footballay API request failed" };
  }
}

function isRuntimeMessage(value: unknown): value is RuntimeMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as { type?: unknown; payload?: unknown };
  if (message.type === "GET_AVAILABLE_LEAGUES") return Object.keys(message).every((key) => key === "type");
  if (!message.payload || typeof message.payload !== "object") return false;
  const payload = message.payload as Record<string, unknown>;
  const validId = (key: string) => typeof payload[key] === "string" && payload[key].length > 0;
  const validEtag = () => payload.etag === undefined || typeof payload.etag === "string";
  if (message.type === "GET_FIXTURES") return validId("leagueUid") && validId("timezone") && ["previous", "exact", "nearest"].includes(payload.mode as string) && (payload.date === undefined || typeof payload.date === "string");
  return ["GET_FIXTURE_INFO", "GET_FIXTURE_STATUS", "GET_FIXTURE_STATISTICS", "GET_FIXTURE_EVENTS", "GET_FIXTURE_LINEUP"].includes(message.type as string) && validId("fixtureUid") && validEtag();
}
