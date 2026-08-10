import axios from "axios";
import type { AvailableLeagueDto } from "@/shared/footballayApiProtocol";

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
