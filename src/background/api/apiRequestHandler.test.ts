import { describe, expect, it, vi } from "vitest";

vi.mock("./footballayApi", () => ({ getAvailableLeagues: vi.fn() }));

import { handleApiRequest } from "./apiRequestHandler";
import * as footballayApi from "./footballayApi";

describe("Footballay API request handler", () => {
  it("accepts the declared available-leagues operation", async () => {
    vi.mocked(footballayApi.getAvailableLeagues).mockResolvedValueOnce([]);

    await expect(handleApiRequest({ type: "GET_AVAILABLE_LEAGUES" })).resolves.toEqual({ ok: true, data: [] });
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
  });
});
