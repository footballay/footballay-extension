export const GET_AVAILABLE_LEAGUES = 'GET_AVAILABLE_LEAGUES';
export const GET_FIXTURES = 'GET_FIXTURES';
export const GET_MATCH_DATA = 'GET_MATCH_DATA';

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

export type MatchDataDto = {
  info: {
    fixtureUid: string;
    home?: MatchTeamDto | null;
    away?: MatchTeamDto | null;
  };
  status: {
    liveStatus: {
      elapsed?: number | null;
      shortStatus: string;
      score: { home?: number | null; away?: number | null };
    };
  };
  statistics: {
    home?: MatchStatisticsTeamDto | null;
    away?: MatchStatisticsTeamDto | null;
  };
  events: { events: MatchEventDto[] };
  lineup: {
    lineup: { home?: MatchLineupDto | null; away?: MatchLineupDto | null };
  };
};

export type MatchTeamDto = { name: string; koreanName?: string | null };
export type MatchStatisticsTeamDto = {
  teamStatistics: {
    ballPossession: number;
    xg: Array<{ xg: string }>;
    totalShots: number;
    shotsOnGoal: number;
    cornerKicks: number;
    fouls: number;
  };
};
export type MatchEventDto = {
  sequence: number;
  elapsed: number;
  type: string;
  detail: string;
  team: MatchTeamDto;
  player?: MatchPlayerDto | null;
};
export type MatchPlayerDto = { name: string; koreanName?: string | null };
export type MatchLineupDto = {
  teamName: string;
  teamKoreanName?: string | null;
  formation?: string | null;
  players: MatchLineupPlayerDto[];
  substitutes: MatchLineupPlayerDto[];
};
export type MatchLineupPlayerDto = MatchPlayerDto & { number?: number | null };

export type GetFixturesPayload = {
  leagueUid: string;
  date: string;
  mode: 'previous' | 'exact' | 'nearest';
  timezone: string;
};

export type FootballayApiResponse<T> =
  { ok: true; data: T } | { ok: false; error: string };

export type AvailableLeaguesResponse = FootballayApiResponse<
  AvailableLeagueDto[]
>;
export type FixturesResponse = FootballayApiResponse<FixtureDto[]>;
export type MatchDataResponse = FootballayApiResponse<MatchDataDto>;

export function requestAvailableLeagues(): Promise<AvailableLeaguesResponse> {
  return chrome.runtime.sendMessage({
    type: GET_AVAILABLE_LEAGUES,
  }) as Promise<AvailableLeaguesResponse>;
}

export function requestFixtures(
  payload: GetFixturesPayload,
): Promise<FixturesResponse> {
  return chrome.runtime.sendMessage({
    type: GET_FIXTURES,
    payload,
  }) as Promise<FixturesResponse>;
}

export function requestMatchData(
  fixtureUid: string,
): Promise<MatchDataResponse> {
  return chrome.runtime.sendMessage({
    type: GET_MATCH_DATA,
    payload: { fixtureUid },
  }) as Promise<MatchDataResponse>;
}
