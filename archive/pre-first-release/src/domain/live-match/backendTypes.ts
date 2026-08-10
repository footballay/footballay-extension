export type AvailableLeagueResponse = {
  uid: string;
  name: string;
  nameKo?: string | null;
  logo?: string | null;
};

export type FixtureByLeagueResponse = {
  uid: string;
  kickoff?: string | null;
  round: string;
  homeTeam?: FixtureTeamInfo | null;
  awayTeam?: FixtureTeamInfo | null;
  status: {
    longStatus: string;
    shortStatus: string;
    elapsed?: number | null;
  };
  score: {
    home?: number | null;
    away?: number | null;
  };
  available: boolean;
};

export type FixtureTeamInfo = {
  uid?: string | null;
  name: string;
  nameKo?: string | null;
  logo?: string | null;
};

export type FixtureInfoResponse = {
  fixtureUid: string;
  referee?: string | null;
  date: string;
  league: {
    leagueUid: string;
    name: string;
    koreanName?: string | null;
    logo?: string | null;
  };
  home?: FixtureInfoTeam | null;
  away?: FixtureInfoTeam | null;
};

export type FixtureInfoTeam = {
  teamUid: string;
  name: string;
  koreanName?: string | null;
  logo?: string | null;
  playerColor?: UniformColorDto | null;
};

export type FixtureLiveStatusResponse = {
  fixtureUid: string;
  liveStatus: {
    elapsed?: number | null;
    shortStatus: string;
    longStatus: string;
    score: {
      home?: number | null;
      away?: number | null;
    };
  };
};

export type FixtureStatisticsResponse = {
  fixture: {
    uid: string;
    elapsed?: number | null;
    status: string;
  };
  home?: TeamWithStatistics | null;
  away?: TeamWithStatistics | null;
};

export type FixtureEventsResponse = {
  fixtureUid: string;
  events: FixtureEventInfoResponse[];
};

export type FixtureEventInfoResponse = {
  sequence: number;
  elapsed: number;
  extraTime?: number | null;
  team: FixtureEventTeamInfoResponse;
  player?: FixtureEventPlayerInfoResponse | null;
  assist?: FixtureEventPlayerInfoResponse | null;
  type: string;
  detail: string;
  comments?: string | null;
};

export type FixtureEventTeamInfoResponse = {
  teamUid: string;
  name: string;
  koreanName?: string | null;
  playerColor?: UniformColorDto | null;
};

export type FixtureEventPlayerInfoResponse = {
  matchPlayerUid: string;
  playerUid?: string | null;
  name: string;
  koreanName?: string | null;
  number?: number | null;
};

export type FixtureLineupResponse = {
  fixtureUid: string;
  lineup: {
    home?: FixtureStartLineupResponse | null;
    away?: FixtureStartLineupResponse | null;
  };
};

export type FixtureStartLineupResponse = {
  teamUid: string;
  teamName: string;
  teamKoreanName?: string | null;
  formation?: string | null;
  players: FixtureLineupPlayerResponse[];
  substitutes: FixtureLineupPlayerResponse[];
  playerColor?: UniformColorDto | null;
};

export type FixtureLineupPlayerResponse = {
  matchPlayerUid: string;
  playerUid?: string | null;
  name: string;
  koreanName?: string | null;
  number?: number | null;
  photo?: string | null;
  position?: string | null;
  grid?: string | null;
  substitute: boolean;
};

export type TeamWithStatistics = {
  team: FixtureInfoTeam;
  teamStatistics: TeamStatistics;
  playerStatistics: PlayerWithStatistics[];
};

export type TeamStatistics = {
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
  xg: TeamExpectedGoalResponse[];
};

export type TeamExpectedGoalResponse = {
  elapsed: number;
  xg: string;
};

export type PlayerWithStatistics = {
  player: {
    matchPlayerUid: string;
    playerUid?: string | null;
    name: string;
    koreanName?: string | null;
    photo?: string | null;
    position?: string | null;
    number?: number | null;
  };
  statistics: {
    minutesPlayed: number;
    position?: string | null;
    rating?: string | null;
    captain: boolean;
    substitute: boolean;
    goals: number;
    goalsConceded: number;
    assists: number;
    shotsTotal: number;
    shotsOn: number;
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

export type UniformColorDto = {
  primary?: string | null;
  number?: string | null;
  border?: string | null;
};
