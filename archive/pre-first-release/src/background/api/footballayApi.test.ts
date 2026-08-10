import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosGet = vi.hoisted(() => vi.fn());
const axiosCreate = vi.hoisted(() => vi.fn(() => ({ get: axiosGet })));
vi.mock("axios", () => ({ default: { create: axiosCreate } }));

import { getAvailableLeagues, getFixtureStatus } from "./footballayApi";

describe("Footballay privileged API transport", () => {
  beforeEach(() => axiosGet.mockReset());

  it("keeps raw league responses out of domain mapping", async () => {
    axiosGet.mockResolvedValueOnce({ data: [{ uid: "league-1", name: "Premier League" }] });
    await expect(getAvailableLeagues()).resolves.toEqual([{ uid: "league-1", name: "Premier League" }]);
    expect(axiosGet).toHaveBeenCalledWith("/v1/football/leagues/available");
  });

  it("returns updated ETag responses with the raw response data", async () => {
    axiosGet.mockResolvedValueOnce({
      data: { fixtureUid: "fixture-1", liveStatus: { score: {}, shortStatus: "NS", longStatus: "Not Started" } },
      headers: { etag: "etag-1" },
      status: 200
    });
    await expect(getFixtureStatus("fixture-1")).resolves.toEqual({
      type: "updated",
      data: { fixtureUid: "fixture-1", liveStatus: { score: {}, shortStatus: "NS", longStatus: "Not Started" } },
      etag: "etag-1"
    });
  });

  it("sends If-None-Match and returns a not-modified response with its ETag", async () => {
    axiosGet.mockResolvedValueOnce({ data: undefined, headers: { etag: "etag-2" }, status: 304 });
    await expect(getFixtureStatus("fixture-1", "etag-1")).resolves.toEqual({ type: "not-modified", etag: "etag-2" });
    expect(axiosGet).toHaveBeenCalledWith(
      "/v1/football/fixtures/fixture-1/status",
      expect.objectContaining({ headers: { "If-None-Match": "etag-1" }, validateStatus: expect.any(Function) })
    );
  });
});
