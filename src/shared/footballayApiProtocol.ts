export const GET_AVAILABLE_LEAGUES = 'GET_AVAILABLE_LEAGUES';
export const GET_FIXTURES = 'GET_FIXTURES';
export const GET_FIXTURE_STATUS = 'GET_FIXTURE_STATUS';
export const GET_FIXTURE_LINEUP = 'GET_FIXTURE_LINEUP';
export const GET_FIXTURE_EVENTS = 'GET_FIXTURE_EVENTS';
export const GET_FIXTURE_STATISTICS = 'GET_FIXTURE_STATISTICS';

export type AvailableLeagueDto = {
  uid: string;
  name: string;
  nameKo?: string | null;
  logo?: string | null;
};

export type FixtureDto = {
  uid: string;
  kickoff?: string | null;
  homeTeam?: FixtureTeamDto | null;
  awayTeam?: FixtureTeamDto | null;
  status: { shortStatus: string };
  score: { home?: number | null; away?: number | null };
};

export type FixtureTeamDto = { name: string; nameKo?: string | null };
export type FixtureStatusDto = {
  liveStatus: {
    elapsed?: number | null;
    shortStatus: string;
    score: { home?: number | null; away?: number | null };
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
export type FixtureStatisticsDto = {
  home?: MatchStatisticsTeamDto | null;
  away?: MatchStatisticsTeamDto | null;
};
export type MatchEventDto = {
  sequence: number;
  elapsed: number;
  type: string;
  detail: string;
  team: MatchTeamDto;
  player?: MatchPlayerDto | null;
};
export type FixtureEventsDto = { events: MatchEventDto[] };
export type MatchPlayerDto = { name: string; koreanName?: string | null };
export type MatchLineupDto = {
  teamName: string;
  teamKoreanName?: string | null;
  formation?: string | null;
  players: MatchLineupPlayerDto[];
  substitutes: MatchLineupPlayerDto[];
};
export type MatchLineupPlayerDto = MatchPlayerDto & { number?: number | null };
export type FixtureLineupDto = {
  lineup: { home?: MatchLineupDto | null; away?: MatchLineupDto | null };
};

export type GetFixturesPayload = {
  leagueUid: string;
  date: string;
  mode: 'previous' | 'exact' | 'nearest';
  timezone: string;
};
export type FixtureEtagPayload = { fixtureUid: string; etag?: string };
export type FootballayApiResponse<T> =
  { ok: true; data: T } | { ok: false; error: string };
export type EtaggedResponse<T> =
  | { type: 'updated'; data: T; etag?: string }
  | { type: 'not-modified'; etag?: string };

export type AvailableLeaguesResponse = FootballayApiResponse<
  AvailableLeagueDto[]
>;
export type FixturesResponse = FootballayApiResponse<FixtureDto[]>;
export type FixtureStatusResponse = FootballayApiResponse<
  EtaggedResponse<FixtureStatusDto>
>;
export type FixtureLineupResponse = FootballayApiResponse<
  EtaggedResponse<FixtureLineupDto>
>;
export type FixtureEventsResponse = FootballayApiResponse<
  EtaggedResponse<FixtureEventsDto>
>;
export type FixtureStatisticsResponse = FootballayApiResponse<
  EtaggedResponse<FixtureStatisticsDto>
>;

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

function requestFixtureData<T>(
  type: string,
  payload: FixtureEtagPayload,
): Promise<FootballayApiResponse<EtaggedResponse<T>>> {
  return chrome.runtime.sendMessage({
    type,
    payload,
  }) as Promise<FootballayApiResponse<EtaggedResponse<T>>>;
}

export function requestFixtureStatus(
  payload: FixtureEtagPayload,
): Promise<FixtureStatusResponse> {
  return requestFixtureData(GET_FIXTURE_STATUS, payload);
}

export function requestFixtureLineup(
  payload: FixtureEtagPayload,
): Promise<FixtureLineupResponse> {
  return requestFixtureData(GET_FIXTURE_LINEUP, payload);
}

export function requestFixtureEvents(
  payload: FixtureEtagPayload,
): Promise<FixtureEventsResponse> {
  return requestFixtureData(GET_FIXTURE_EVENTS, payload);
}

export function requestFixtureStatistics(
  payload: FixtureEtagPayload,
): Promise<FixtureStatisticsResponse> {
  return requestFixtureData(GET_FIXTURE_STATISTICS, payload);
}
