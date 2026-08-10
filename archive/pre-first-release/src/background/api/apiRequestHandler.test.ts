import { describe, expect, it, vi } from "vitest";
import { handleApiRequest } from "./apiRequestHandler";
import * as footballayApi from "./footballayApi";

vi.mock("./footballayApi", () => ({ getAvailableLeagues: vi.fn() }));

describe("Footballay API request handler", () => {
  it("accepts only declared Footballay operations", async () => {
    vi.mocked(footballayApi.getAvailableLeagues).mockResolvedValueOnce([]);
    await expect(handleApiRequest({ type: "GET_AVAILABLE_LEAGUES" })).resolves.toEqual({ ok: true, data: [] });
    await expect(handleApiRequest({ type: "FETCH", payload: { method: "GET", url: "https://example.com" } })).resolves.toEqual({
      ok: false,
      error: "Invalid Footballay API request"
    });
  });

  it("rejects malformed payloads before any API call", async () => {
    await expect(handleApiRequest({ type: "GET_FIXTURE_STATUS", payload: { fixtureUid: 42 } })).resolves.toEqual({
      ok: false,
      error: "Invalid Footballay API request"
    });
  });
});
