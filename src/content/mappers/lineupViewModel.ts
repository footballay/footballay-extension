import {
  getMatchEventKind,
  type FixtureEventsDto,
  type MatchEventDto,
  type MatchLineupDto,
  type MatchLineupPlayerDto,
  type MatchStatisticsTeamDto,
} from '@/shared/footballayApiProtocol';

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

function players(player: LineupPlayer): LineupPlayer[] {
  return [player, ...(player.replacement ? players(player.replacement) : [])];
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
      .flatMap(players)
      .flatMap((player) =>
        player.player.matchPlayerUid
          ? [[player.player.matchPlayerUid, player]]
          : [],
      ),
  );
  const statisticsByUid = new Map(
    (statistics?.playerStatistics ?? []).flatMap((statistic) =>
      statistic.player.matchPlayerUid
        ? [[statistic.player.matchPlayerUid, statistic]]
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
