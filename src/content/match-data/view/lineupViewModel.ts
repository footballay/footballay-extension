import { getMatchEventKind } from '@/shared/football/matchEvent';
import type {
  FixtureEventsDto,
  FixtureLineupDto,
  FixtureStatisticsDto,
  MatchEventDto,
  MatchLineupDto,
  MatchLineupPlayerDto,
  MatchStatisticsTeamDto,
} from '@/shared/api/dto';
import { resolveTeamColors } from './teamColor';

export type LineupPlayer = {
  player: MatchLineupPlayerDto;
  replacement?: LineupPlayer;
  subInTime?: string;
  goals: number;
  ownGoals: number;
  yellowCards: number;
  redCards: number;
  rating: string | null;
};

export type LineupTeam = Omit<MatchLineupDto, 'players'> & {
  players: LineupPlayer[];
};

export type LineupTeamView = LineupTeam & {
  columns: LineupPlayer[][];
  color: string;
};

export type LineupViewModel = {
  home?: LineupTeamView;
  away?: LineupTeamView;
};

function eventTime(event: MatchEventDto) {
  return `${event.elapsed}${event.extraTime ? `+${event.extraTime}` : ''}'`;
}

function fallbackPlayer(
  event: MatchEventDto,
): MatchLineupPlayerDto | undefined {
  if (!event.player) return undefined;
  return {
    ...event.player,
    photo: null,
    position: null,
    grid: null,
    substitute: true,
  };
}

function currentPlayer(player: LineupPlayer): LineupPlayer {
  return player.replacement ? currentPlayer(player.replacement) : player;
}

function playerChain(player: LineupPlayer): LineupPlayer[] {
  return [
    player,
    ...(player.replacement ? playerChain(player.replacement) : []),
  ];
}

function formationColumns(team: LineupTeam): LineupPlayer[][] {
  const counts = (team.formation ?? '')
    .split('-')
    .map(Number)
    .filter((count) => Number.isInteger(count) && count > 0);
  const columnSizes = [1, ...counts];
  const playerCount = columnSizes.reduce((sum, count) => sum + count, 0);
  const players = team.players.slice(0, playerCount).map(currentPlayer);
  let offset = 0;

  return columnSizes.map((count) => {
    const column = players.slice(offset, offset + count);
    offset += count;
    return column;
  });
}

export function buildLineupTeam(
  team: MatchLineupDto | null | undefined,
  events: FixtureEventsDto | undefined,
  statistics: MatchStatisticsTeamDto | null | undefined,
): LineupTeam | undefined {
  if (!team) return undefined;

  const roster = new Map(
    [...team.players, ...team.substitutes].map((player) => [
      player.matchPlayerUid,
      player,
    ]),
  );
  const starters: LineupPlayer[] = team.players.map((player) => ({
    player,
    goals: 0,
    ownGoals: 0,
    yellowCards: 0,
    redCards: 0,
    rating: null,
  }));

  for (const event of events?.events ?? []) {
    if (event.type !== 'Subst' || event.team.teamUid !== team.teamUid) continue;
    const outgoingUid = event.assist?.matchPlayerUid;
    const incomingUid = event.player?.matchPlayerUid;
    if (!outgoingUid || !incomingUid) continue;

    const outgoing = starters
      .map(currentPlayer)
      .find((player) => player.player.matchPlayerUid === outgoingUid);
    const incoming = roster.get(incomingUid) ?? fallbackPlayer(event);
    if (!outgoing || !incoming) continue;

    outgoing.replacement = {
      player: incoming,
      subInTime: eventTime(event),
      goals: 0,
      ownGoals: 0,
      yellowCards: 0,
      redCards: 0,
      rating: null,
    };
  }

  const playerByUid = new Map(
    starters
      .flatMap(playerChain)
      .flatMap((player) =>
        player.player.matchPlayerUid
          ? [[player.player.matchPlayerUid, player] as const]
          : [],
      ),
  );
  const statisticsByUid = new Map(
    (statistics?.playerStatistics ?? []).flatMap((statistic) =>
      statistic.player.matchPlayerUid
        ? [[statistic.player.matchPlayerUid, statistic] as const]
        : [],
    ),
  );

  for (const player of playerByUid.values()) {
    const statistic = statisticsByUid.get(player.player.matchPlayerUid);
    if (!statistic) continue;
    player.yellowCards = statistic.statistics.yellowCards;
    player.redCards = statistic.statistics.redCards;
    player.rating = statistic.statistics.rating;
  }

  for (const event of events?.events ?? []) {
    const player = event.player?.matchPlayerUid
      ? playerByUid.get(event.player.matchPlayerUid)
      : undefined;
    if (!player || getMatchEventKind(event) !== 'goal') continue;
    if (event.detail === 'Own Goal') player.ownGoals += 1;
    else player.goals += 1;
  }

  return { ...team, players: starters };
}

export function buildLineupViewModel(
  lineup: FixtureLineupDto | undefined,
  events: FixtureEventsDto | undefined,
  statistics: FixtureStatisticsDto | undefined,
): LineupViewModel {
  const home = buildLineupTeam(lineup?.lineup.home, events, statistics?.home);
  const away = buildLineupTeam(lineup?.lineup.away, events, statistics?.away);
  const colors = resolveTeamColors(home, away);

  return {
    home: home
      ? { ...home, columns: formationColumns(home), color: colors.home }
      : undefined,
    away: away
      ? { ...away, columns: formationColumns(away), color: colors.away }
      : undefined,
  };
}
