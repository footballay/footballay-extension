import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosGet = vi.hoisted(() => vi.fn());
const axiosCreate = vi.hoisted(() => vi.fn(() => ({ get: axiosGet })));
vi.mock("axios", () => ({ default: { create: axiosCreate } }));

import { getAvailableLeagues } from "./footballayApi";

describe("Footballay privileged API transport", () => {
  beforeEach(() => axiosGet.mockReset());

  it("retrieves the raw available-league response from its declared endpoint", async () => {
    const response = [{ uid: "league-1", name: "Premier League", nameKo: "프리미어리그" }];
    axiosGet.mockResolvedValueOnce({ data: response });

    await expect(getAvailableLeagues()).resolves.toEqual(response);
    expect(axiosGet).toHaveBeenCalledWith("/v1/football/leagues/available");
  });
});
