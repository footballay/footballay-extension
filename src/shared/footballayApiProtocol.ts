export const GET_AVAILABLE_LEAGUES = "GET_AVAILABLE_LEAGUES";
export const GET_FIXTURES = "GET_FIXTURES";

/** Raw Footballay data transferred from the service worker to the Content App. */
export type AvailableLeagueDto = {
  uid: string;
  name: string;
  nameKo?: string | null;
  logo?: string | null;
};

/** Raw Footballay fixture data transferred from the service worker to the Content App. */
export type FixtureDto = {
  uid: string;
  kickoff?: string | null;
  homeTeam?: FixtureTeamDto | null;
  awayTeam?: FixtureTeamDto | null;
  status: {
    shortStatus: string;
  };
  score: {
    home?: number | null;
    away?: number | null;
  };
};

export type FixtureTeamDto = {
  name: string;
  nameKo?: string | null;
};

export type GetFixturesPayload = {
  leagueUid: string;
  date: string;
  mode: "nearest";
  timezone: string;
};

export type FootballayApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type AvailableLeaguesResponse = FootballayApiResponse<AvailableLeagueDto[]>;
export type FixturesResponse = FootballayApiResponse<FixtureDto[]>;

export function requestAvailableLeagues(): Promise<AvailableLeaguesResponse> {
  return chrome.runtime.sendMessage({ type: GET_AVAILABLE_LEAGUES }) as Promise<AvailableLeaguesResponse>;
}

export function requestFixtures(payload: GetFixturesPayload): Promise<FixturesResponse> {
  return chrome.runtime.sendMessage({ type: GET_FIXTURES, payload }) as Promise<FixturesResponse>;
}
