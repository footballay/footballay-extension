import { describe, expect, it, vi } from "vitest";

vi.mock("./footballayApi", () => ({ getAvailableLeagues: vi.fn(), getFixtures: vi.fn() }));

import { handleApiRequest } from "./apiRequestHandler";
import * as footballayApi from "./footballayApi";

describe("Footballay API request handler", () => {
  it("accepts the declared available-leagues operation", async () => {
    vi.mocked(footballayApi.getAvailableLeagues).mockResolvedValueOnce([]);

    await expect(handleApiRequest({ type: "GET_AVAILABLE_LEAGUES" })).resolves.toEqual({ ok: true, data: [] });
  });

  it("accepts a declared fixture operation with its validated payload", async () => {
    vi.mocked(footballayApi.getFixtures).mockResolvedValueOnce([]);

    await expect(handleApiRequest({
      type: "GET_FIXTURES",
      payload: { leagueUid: "league-1", date: "2026-08-11", mode: "nearest", timezone: "Asia/Seoul" }
    })).resolves.toEqual({ ok: true, data: [] });
    expect(footballayApi.getFixtures).toHaveBeenCalledWith({
      leagueUid: "league-1",
      date: "2026-08-11",
      mode: "nearest",
      timezone: "Asia/Seoul"
    });
  });

  it("rejects arbitrary or malformed proxy requests", async () => {
    await expect(handleApiRequest({ type: "FETCH", payload: { url: "https://example.com" } })).resolves.toEqual({
      ok: false,
      error: "Invalid Footballay API request"
    });
    await expect(handleApiRequest({ type: "GET_AVAILABLE_LEAGUES", payload: {} })).resolves.toEqual({
      ok: false,
      error: "Invalid Footballay API request"
    });
    await expect(handleApiRequest({ type: "GET_AVAILABLE_LEAGUES", url: "https://example.com" })).resolves.toEqual({
      ok: false,
      error: "Invalid Footballay API request"
    });
    await expect(handleApiRequest({
      type: "GET_FIXTURES",
      payload: { leagueUid: "league-1", date: "2026-02-30", mode: "anything", timezone: "Asia/Seoul" }
    })).resolves.toEqual({
      ok: false,
      error: "Invalid Footballay API request"
    });
  });
});
