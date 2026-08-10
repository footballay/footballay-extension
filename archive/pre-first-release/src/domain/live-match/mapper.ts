import type {
  AvailableLeagueResponse,
  FixtureEventsResponse,
  FixtureByLeagueResponse,
  FixtureInfoResponse,
  FixtureLiveStatusResponse,
  FixtureLineupPlayerResponse,
  FixtureLineupResponse,
  FixtureStartLineupResponse,
  FixtureStatisticsResponse,
  PlayerWithStatistics,
  TeamWithStatistics
} from "./backendTypes";
import type {
  AvailableLeague,
  FixtureSummary,
  LineupPlayer,
  LiveMatchOverlayData,
  MatchEvent,
  MatchLineup,
  TeamColor,
  TeamLineup,
  TopPlayer
} from "./types";

export function mapAvailableLeague(response: AvailableLeagueResponse): AvailableLeague {
  return {
    uid: response.uid,
    name: response.name,
    nameKo: response.nameKo
  };
}

export function mapFixtureSummary(response: FixtureByLeagueResponse): FixtureSummary {
  return {
    uid: response.uid,
    kickoff: response.kickoff,
    round: response.round,
    homeTeamName: getDisplayName(response.homeTeam),
    awayTeamName: getDisplayName(response.awayTeam),
    statusShort: response.status.shortStatus,
    statusLong: response.status.longStatus,
    elapsed: response.status.elapsed,
    homeScore: response.score.home,
    awayScore: response.score.away,
    available: response.available
  };
}

export function mapFixtureLiveData(
  info: FixtureInfoResponse,
  status: FixtureLiveStatusResponse,
  statistics: FixtureStatisticsResponse,
  events?: FixtureEventsResponse,
  lineup?: FixtureLineupResponse
): LiveMatchOverlayData {
  return {
    fixtureUid: info.fixtureUid,
    homeTeamName: getDisplayName(info.home),
    homeTeamColor: mapTeamColor(info.home?.playerColor),
    awayTeamName: getDisplayName(info.away),
    awayTeamColor: mapTeamColor(info.away?.playerColor),
    homeScore: status.liveStatus.score.home ?? 0,
    awayScore: status.liveStatus.score.away ?? 0,
    elapsed: status.liveStatus.elapsed ?? statistics.fixture.elapsed ?? undefined,
    statusShort: status.liveStatus.shortStatus,
    homeStats: statistics.home ? mapTeamStats(statistics.home) : undefined,
    awayStats: statistics.away ? mapTeamStats(statistics.away) : undefined,
    topPlayers: getTopPlayers(statistics),
    events: events ? mapMatchEvents(events) : undefined,
    lineup: lineup ? mapMatchLineup(lineup, statistics) : undefined,
    updatedAt: new Date().toISOString()
  };
}

function mapMatchEvents(response: FixtureEventsResponse): MatchEvent[] {
  return response.events.map((event) => ({
    sequence: event.sequence,
    elapsed: event.elapsed,
    extraTime: event.extraTime,
    teamName: getDisplayName(event.team),
    playerMatchPlayerUid: event.player?.matchPlayerUid,
    playerName: event.player ? getDisplayName(event.player) : undefined,
    assistMatchPlayerUid: event.assist?.matchPlayerUid,
    assistName: event.assist ? getDisplayName(event.assist) : undefined,
    type: event.type,
    detail: event.detail,
    comments: event.comments
  }));
}

function mapMatchLineup(response: FixtureLineupResponse, statistics: FixtureStatisticsResponse): MatchLineup {
  return {
    home: response.lineup.home ? mapTeamLineup(response.lineup.home, statistics.home?.playerStatistics ?? []) : undefined,
    away: response.lineup.away ? mapTeamLineup(response.lineup.away, statistics.away?.playerStatistics ?? []) : undefined
  };
}

function mapTeamLineup(lineup: FixtureStartLineupResponse, playerStatistics: PlayerWithStatistics[]): TeamLineup {
  const statisticsByPlayerUid = new Map(
    playerStatistics.map((player) => [player.player.matchPlayerUid, player])
  );

  return {
    teamName: lineup.teamKoreanName ?? lineup.teamName,
    formation: lineup.formation,
    players: lineup.players.map((player) => mapLineupPlayer(player, statisticsByPlayerUid)),
    substitutes: lineup.substitutes.map((player) => mapLineupPlayer(player, statisticsByPlayerUid))
  };
}

function mapLineupPlayer(
  player: FixtureLineupPlayerResponse,
  statisticsByPlayerUid: Map<string, PlayerWithStatistics>
): LineupPlayer {
  const playerStatistics = statisticsByPlayerUid.get(player.matchPlayerUid);

  return {
    matchPlayerUid: player.matchPlayerUid,
    name: player.koreanName ?? player.name,
    number: player.number,
    position: player.position,
    grid: player.grid,
    substitute: player.substitute,
    ...(playerStatistics ? mapLineupPlayerStatistics(playerStatistics) : {})
  };
}

function mapLineupPlayerStatistics(player: PlayerWithStatistics): Partial<LineupPlayer> {
  const rating = parseRating(player.statistics.rating);

  return {
    assists: player.statistics.assists || undefined,
    captain: player.statistics.captain,
    dribblesAttempts: player.statistics.dribblesAttempts || undefined,
    dribblesSuccess: player.statistics.dribblesSuccess || undefined,
    duelsTotal: player.statistics.duelsTotal || undefined,
    duelsWon: player.statistics.duelsWon || undefined,
    foulsCommitted: player.statistics.foulsCommitted || undefined,
    foulsDrawn: player.statistics.foulsDrawn || undefined,
    goals: player.statistics.goals || undefined,
    goalsConceded: player.statistics.goalsConceded || undefined,
    interceptions: player.statistics.interceptions || undefined,
    minutesPlayed: player.statistics.minutesPlayed || undefined,
    passes:
      player.statistics.passesTotal > 0
        ? `${player.statistics.passesAccuracy}/${player.statistics.passesTotal}`
        : undefined,
    passesAccuracy: player.statistics.passesAccuracy || undefined,
    passesKey: player.statistics.passesKey || undefined,
    passesTotal: player.statistics.passesTotal || undefined,
    penaltiesMissed: player.statistics.penaltiesMissed || undefined,
    penaltiesSaved: player.statistics.penaltiesSaved || undefined,
    penaltiesScored: player.statistics.penaltiesScored || undefined,
    rating,
    redCards: player.statistics.redCards || undefined,
    saves: player.statistics.saves || undefined,
    shots: player.statistics.shotsTotal || undefined,
    shotsOn: player.statistics.shotsOn || undefined,
    tacklesTotal: player.statistics.tacklesTotal || undefined,
    yellowCards: player.statistics.yellowCards || undefined
  };
}

function mapTeamStats(team: TeamWithStatistics) {
  const xg = team.teamStatistics.xg.map((point) => ({
    elapsed: point.elapsed,
    xg: point.xg
  }));

  return {
    blockedShots: team.teamStatistics.blockedShots,
    cornerKicks: team.teamStatistics.cornerKicks,
    expectedGoals: xg.at(-1)?.xg,
    fouls: team.teamStatistics.fouls,
    goalkeeperSaves: team.teamStatistics.goalkeeperSaves,
    goalsPrevented: team.teamStatistics.goalsPrevented,
    offsides: team.teamStatistics.offsides,
    passesAccurate: team.teamStatistics.passesAccurate,
    passesAccuracyPercentage: team.teamStatistics.passesAccuracyPercentage,
    shotsOnGoal: team.teamStatistics.shotsOnGoal,
    shotsOffGoal: team.teamStatistics.shotsOffGoal,
    shotsInsideBox: team.teamStatistics.shotsInsideBox,
    shotsOutsideBox: team.teamStatistics.shotsOutsideBox,
    shotsTotal: team.teamStatistics.totalShots,
    totalPasses: team.teamStatistics.totalPasses,
    possession: `${team.teamStatistics.ballPossession}%`,
    yellowCards: team.teamStatistics.yellowCards,
    redCards: team.teamStatistics.redCards,
    xg
  };
}

function getTopPlayers(statistics: FixtureStatisticsResponse): TopPlayer[] {
  return [
    ...(statistics.home?.playerStatistics ?? []).map((player) => mapTopPlayer(player, getDisplayName(statistics.home?.team))),
    ...(statistics.away?.playerStatistics ?? []).map((player) => mapTopPlayer(player, getDisplayName(statistics.away?.team)))
  ]
    .filter((player): player is TopPlayer & { rating: number } => player.rating !== undefined)
    .sort((left, right) => right.rating - left.rating)
    .slice(0, 3);
}

function mapTopPlayer(player: PlayerWithStatistics, teamName: string): TopPlayer {
  const rating = parseRating(player.statistics.rating);

  return {
    name: player.player.koreanName ?? player.player.name,
    teamName,
    rating,
    goals: player.statistics.goals || undefined,
    assists: player.statistics.assists || undefined,
    captain: player.statistics.captain,
    duelsTotal: player.statistics.duelsTotal || undefined,
    duelsWon: player.statistics.duelsWon || undefined,
    foulsCommitted: player.statistics.foulsCommitted || undefined,
    foulsDrawn: player.statistics.foulsDrawn || undefined,
    interceptions: player.statistics.interceptions || undefined,
    minutesPlayed: player.statistics.minutesPlayed || undefined,
    passesAccuracy: player.statistics.passesAccuracy || undefined,
    passesKey: player.statistics.passesKey || undefined,
    passesTotal: player.statistics.passesTotal || undefined,
    redCards: player.statistics.redCards || undefined,
    saves: player.statistics.saves || undefined,
    shotsOn: player.statistics.shotsOn || undefined,
    shots: player.statistics.shotsTotal || undefined,
    tacklesTotal: player.statistics.tacklesTotal || undefined,
    yellowCards: player.statistics.yellowCards || undefined,
    passes:
      player.statistics.passesTotal > 0
        ? `${player.statistics.passesAccuracy}/${player.statistics.passesTotal}`
        : undefined
  };
}

function mapTeamColor(color?: { border?: string | null; number?: string | null; primary?: string | null } | null): TeamColor | undefined {
  const primary = normalizeHexColor(color?.primary);
  const number = normalizeHexColor(color?.number);
  const border = normalizeHexColor(color?.border);

  return primary || number || border ? { border, number, primary } : undefined;
}

function normalizeHexColor(color?: string | null): string | undefined {
  if (!color) {
    return undefined;
  }

  const normalizedColor = color.trim().replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(normalizedColor) ? `#${normalizedColor}` : undefined;
}

function getDisplayName(team?: { name: string; nameKo?: string | null; koreanName?: string | null } | null): string {
  return team?.koreanName ?? team?.nameKo ?? team?.name ?? "TBD";
}

function parseRating(rating?: string | null): number | undefined {
  if (!rating) {
    return undefined;
  }

  const parsed = Number.parseFloat(rating);
  return Number.isFinite(parsed) ? parsed : undefined;
}
