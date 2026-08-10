export type TeamStats = {
  blockedShots?: number;
  cornerKicks?: number;
  expectedGoals?: string;
  fouls?: number;
  goalkeeperSaves?: number;
  goalsPrevented?: number;
  offsides?: number;
  passesAccurate?: number;
  passesAccuracyPercentage?: number;
  shotsOnGoal?: number;
  shotsOffGoal?: number;
  shotsInsideBox?: number;
  shotsOutsideBox?: number;
  shotsTotal?: number;
  totalPasses?: number;
  possession?: string;
  yellowCards?: number;
  redCards?: number;
  xg?: TeamExpectedGoal[];
};

export type TeamExpectedGoal = {
  elapsed: number;
  xg: string;
};

export type TeamColor = {
  border?: string;
  number?: string;
  primary?: string;
};

export type TopPlayer = {
  name: string;
  teamName: string;
  rating?: number;
  goals?: number;
  assists?: number;
  captain?: boolean;
  duelsTotal?: number;
  duelsWon?: number;
  dribblesAttempts?: number;
  dribblesSuccess?: number;
  foulsCommitted?: number;
  foulsDrawn?: number;
  goalsConceded?: number;
  interceptions?: number;
  minutesPlayed?: number;
  passesKey?: number;
  passesTotal?: number;
  passesAccuracy?: number;
  penaltiesMissed?: number;
  penaltiesSaved?: number;
  penaltiesScored?: number;
  redCards?: number;
  saves?: number;
  shotsOn?: number;
  shots?: number;
  tacklesTotal?: number;
  yellowCards?: number;
  passes?: string;
};

export type MatchEvent = {
  sequence: number;
  elapsed: number;
  extraTime?: number | null;
  teamName: string;
  playerMatchPlayerUid?: string;
  playerName?: string;
  assistMatchPlayerUid?: string;
  assistName?: string;
  type: string;
  detail: string;
  comments?: string | null;
};

export type MatchLineup = {
  home?: TeamLineup;
  away?: TeamLineup;
};

export type TeamLineup = {
  teamName: string;
  formation?: string | null;
  players: LineupPlayer[];
  substitutes: LineupPlayer[];
};

export type LineupPlayer = {
  matchPlayerUid: string;
  name: string;
  number?: number | null;
  position?: string | null;
  grid?: string | null;
  substitute: boolean;
  minutesPlayed?: number;
  rating?: number;
  captain?: boolean;
  goals?: number;
  goalsConceded?: number;
  assists?: number;
  shots?: number;
  shotsOn?: number;
  saves?: number;
  passesTotal?: number;
  passesKey?: number;
  passesAccuracy?: number;
  passes?: string;
  tacklesTotal?: number;
  interceptions?: number;
  duelsTotal?: number;
  duelsWon?: number;
  dribblesAttempts?: number;
  dribblesSuccess?: number;
  foulsCommitted?: number;
  foulsDrawn?: number;
  yellowCards?: number;
  redCards?: number;
  penaltiesScored?: number;
  penaltiesMissed?: number;
  penaltiesSaved?: number;
};

export type LiveMatchOverlayData = {
  fixtureUid: string;
  homeTeamName: string;
  homeTeamColor?: TeamColor;
  awayTeamName: string;
  awayTeamColor?: TeamColor;
  homeScore: number;
  awayScore: number;
  elapsed?: number;
  statusShort?: string;
  homeStats?: TeamStats;
  awayStats?: TeamStats;
  topPlayers?: TopPlayer[];
  events?: MatchEvent[];
  lineup?: MatchLineup;
  updatedAt: string;
};

export type AvailableLeague = {
  uid: string;
  name: string;
  nameKo?: string | null;
};

export type FixtureLookupMode = "previous" | "exact" | "nearest";

export type FixtureSummary = {
  uid: string;
  kickoff?: string | null;
  round: string;
  homeTeamName: string;
  awayTeamName: string;
  statusShort: string;
  statusLong: string;
  elapsed?: number | null;
  homeScore?: number | null;
  awayScore?: number | null;
  available: boolean;
};
