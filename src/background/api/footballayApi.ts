import axios from "axios";
import type {
  AvailableLeagueDto,
  FixtureDto,
  GetFixturesPayload
} from "@/shared/footballayApiProtocol";

const footballayApi = axios.create({
  baseURL: import.meta.env.VITE_FOOTBALLAY_API_BASE_URL?.trim() || "https://api.footballay.com",
  headers: { Accept: "application/json" }
});

/**
 * Privileged HTTP transport only. It returns raw data for the extension
 * message contract and holds no Content application state.
 */
export async function getAvailableLeagues(): Promise<AvailableLeagueDto[]> {
  const response = await footballayApi.get<AvailableLeagueDto[]>("/v1/football/leagues/available");
  return response.data;
}

export async function getFixtures({ leagueUid, date, mode, timezone }: GetFixturesPayload): Promise<FixtureDto[]> {
  const query = new URLSearchParams({ date, mode, timezone });
  const response = await footballayApi.get<FixtureDto[]>(
    `/v1/football/leagues/${encodeURIComponent(leagueUid)}/fixtures?${query}`
  );
  return response.data;
}
