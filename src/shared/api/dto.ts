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
  secondary?: string | null;
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
