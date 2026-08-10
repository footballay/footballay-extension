export const GET_AVAILABLE_LEAGUES = "GET_AVAILABLE_LEAGUES";

/** Raw Footballay data transferred from the service worker to the Content App. */
export type AvailableLeagueDto = {
  uid: string;
  name: string;
  nameKo?: string | null;
  logo?: string | null;
};

export type FootballayApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type AvailableLeaguesResponse = FootballayApiResponse<AvailableLeagueDto[]>;

export function requestAvailableLeagues(): Promise<AvailableLeaguesResponse> {
  return chrome.runtime.sendMessage({ type: GET_AVAILABLE_LEAGUES }) as Promise<AvailableLeaguesResponse>;
}
