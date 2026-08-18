export const GET_AVAILABLE_LEAGUES = 'GET_AVAILABLE_LEAGUES';
export const GET_FIXTURES = 'GET_FIXTURES';
export const GET_FIXTURE_DATES = 'GET_FIXTURE_DATES';
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
  fixtureUid: string;
  liveStatus: {
    elapsed: number | null;
    shortStatus: string;
    longStatus: string;
    score: { home: number | null; away: number | null };
  };
};
export type MatchTeamDto = {
  teamUid: string;
  name: string;
  koreanName: string | null;
  playerColor: MatchPlayerColorDto | null;
};
export type MatchStatisticsTeamInfoDto = {
  teamUid: string;
  name: string;
  koreanName: string | null;
  logo: string | null;
  playerColor: MatchPlayerColorDto | null;
};
export type MatchPlayerColorDto = {
  primary: string;
  number: string;
  border: string | null;
};
export type MatchTeamStatisticsDto = {
  shotsOnGoal: number;
  shotsOffGoal: number;
  totalShots: number;
  blockedShots: number;
  shotsInsideBox: number;
  shotsOutsideBox: number;
  fouls: number;
  cornerKicks: number;
  offsides: number;
  ballPossession: number;
  yellowCards: number;
  redCards: number;
  goalkeeperSaves: number;
  totalPasses: number;
  passesAccurate: number;
  passesAccuracyPercentage: number;
  goalsPrevented: number;
  xg: Array<{ elapsed: number; xg: string }>;
};
export type MatchPlayerDto = {
  matchPlayerUid: string;
  playerUid: string | null;
  name: string;
  koreanName: string | null;
  number: number | null;
};
export type MatchStatisticsTeamDto = {
  team: MatchStatisticsTeamInfoDto;
  teamStatistics: MatchTeamStatisticsDto;
  playerStatistics: MatchPlayerStatisticsDto[];
};
export type MatchPlayerStatisticsDto = {
  player: MatchStatisticsPlayerDto;
  statistics: {
    minutesPlayed: number;
    position: string | null;
    rating: string | null;
    captain: boolean;
    substitute: boolean;
    shotsTotal: number;
    shotsOn: number;
    goals: number;
    goalsConceded: number;
    assists: number;
    saves: number;
    passesTotal: number;
    passesKey: number;
    passesAccuracy: number;
    tacklesTotal: number;
    interceptions: number;
    duelsTotal: number;
    duelsWon: number;
    dribblesAttempts: number;
    dribblesSuccess: number;
    foulsCommitted: number;
    foulsDrawn: number;
    yellowCards: number;
    redCards: number;
    penaltiesScored: number;
    penaltiesMissed: number;
    penaltiesSaved: number;
  };
};
export type MatchStatisticsPlayerDto = MatchPlayerDto & {
  photo: string | null;
  position: string | null;
};
export type FixtureStatisticsDto = {
  fixture: { uid: string; elapsed: number | null; status: string };
  home: MatchStatisticsTeamDto | null;
  away: MatchStatisticsTeamDto | null;
};
export type MatchEventDto = {
  sequence: number;
  elapsed: number;
  extraTime: number | null;
  team: MatchTeamDto;
  player: MatchPlayerDto | null;
  assist: MatchPlayerDto | null;
  type: string;
  detail: string;
  comments: string | null;
};
export type FixtureEventsDto = { fixtureUid: string; events: MatchEventDto[] };
export type MatchEventKind = 'goal' | 'missed-penalty' | 'other';

export function getMatchEventKind(event: MatchEventDto): MatchEventKind {
  if (event.type === 'Goal') return 'goal';
  if (event.type === 'ETC' && event.detail === 'Missed Penalty')
    return 'missed-penalty';
  return 'other';
}
export type MatchLineupDto = {
  teamUid: string;
  teamName: string;
  teamKoreanName: string | null;
  formation: string | null;
  players: MatchLineupPlayerDto[];
  substitutes: MatchLineupPlayerDto[];
  playerColor: MatchPlayerColorDto | null;
};
export type MatchLineupPlayerDto = MatchPlayerDto & {
  photo: string | null;
  position: string | null;
  grid: string | null;
  substitute: boolean;
};
export type FixtureLineupDto = {
  fixtureUid: string;
  lineup: { home: MatchLineupDto | null; away: MatchLineupDto | null };
};

export type FixtureStatusGroup =
  'upcoming' | 'playing' | 'paused' | 'finished' | 'not-played' | 'unknown';

export function getFixtureStatusGroup(status: string): FixtureStatusGroup {
  if (['TBD', 'NS'].includes(status)) return 'upcoming';
  if (['1H', '2H', 'ET', 'P', 'LIVE'].includes(status)) return 'playing';
  if (['HT', 'BT', 'SUSP', 'INT'].includes(status)) return 'paused';
  if (['FT', 'AET', 'PEN'].includes(status)) return 'finished';
  if (['PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(status)) return 'not-played';
  return 'unknown';
}

export type GetFixturesPayload = {
  leagueUid: string;
  date: string;
  mode: 'previous' | 'exact' | 'nearest';
  timezone: string;
};
export type GetFixtureDatesPayload = {
  leagueUid: string;
  startDate: string;
  endDate: string;
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
export type FixtureDatesResponse = FootballayApiResponse<string[]>;
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

export function requestFixtureDates(
  payload: GetFixtureDatesPayload,
): Promise<FixtureDatesResponse> {
  return chrome.runtime.sendMessage({
    type: GET_FIXTURE_DATES,
    payload,
  }) as Promise<FixtureDatesResponse>;
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
