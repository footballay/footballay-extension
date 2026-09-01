import type {
  AvailableLeagueDto,
  FixtureDto,
  FixtureEventsDto,
  FixtureLineupDto,
  FixtureStatusDto,
  FixtureStatisticsDto,
  MatchLineupDto,
  MatchLineupPlayerDto,
  MatchPlayerDto,
  MatchPlayerStatisticsDto,
  MatchStatisticsTeamDto,
} from '@/shared/api/dto';

const fixtureUid = 'demo-fixture';
const homeTeam = {
  teamUid: 'demo-home',
  name: 'HOME',
  shortName: 'HOME',
  playerColor: { primary: '#3c7bff', number: null, border: null },
};
const awayTeam = {
  teamUid: 'demo-away',
  name: 'AWAY',
  shortName: 'AWAY',
  playerColor: { primary: '#9d4058', number: null, border: null },
};

function players(
  teamUid: string,
  roster: readonly [number, string][],
): MatchLineupPlayerDto[] {
  return roster.map(([number, name]) => ({
    matchPlayerUid: `${teamUid}-${number}`,
    playerUid: null,
    name,
    shortName: name.split(' ').at(-1) ?? name,
    number,
    photo: null,
    position: null,
    grid: null,
    substitute: false,
  }));
}

const homePlayers = players('demo-home', [
  [1, 'James Wilson'],
  [23, 'Daniel Parker'],
  [4, 'Oliver Brown'],
  [5, 'Ethan Walker'],
  [3, 'Lucas Martin'],
  [21, 'Mateo Silva'],
  [8, 'Noah Bennett'],
  [11, 'Liam Carter'],
  [20, 'Henry Collins'],
  [19, 'Owen Murphy'],
  [9, 'Jack Turner'],
]);
const awayPlayers = players('demo-away', [
  [1, 'Leo Harris'],
  [2, 'Ryan Foster'],
  [3, 'Adam Cooper'],
  [22, 'Nathan Reed'],
  [23, 'Caleb Morgan'],
  [8, 'Mason Scott'],
  [14, 'Isaac Young'],
  [5, 'Logan Price'],
  [11, 'Aaron Hughes'],
  [9, 'Dylan Ross'],
  [7, 'Samuel King'],
]);

function lineup(
  team: typeof homeTeam,
  formation: string,
  teamPlayers: MatchLineupPlayerDto[],
  color: string,
): MatchLineupDto {
  return {
    ...team,
    teamName: team.name,
    teamShortName: team.shortName,
    formation,
    players: teamPlayers,
    substitutes: [],
    playerColor: { primary: color, number: null, border: null },
  };
}

function player(
  teamPlayers: MatchLineupPlayerDto[],
  number: number,
): MatchPlayerDto {
  const selected = teamPlayers.find((item) => item.number === number)!;
  return {
    matchPlayerUid: selected.matchPlayerUid,
    playerUid: selected.playerUid,
    name: selected.name,
    shortName: selected.shortName,
    number: selected.number,
  };
}

function playerStatistics(
  teamPlayers: MatchLineupPlayerDto[],
  ratings: readonly string[],
): MatchPlayerStatisticsDto[] {
  return teamPlayers.map((item, index) => ({
    player: {
      ...player(teamPlayers, item.number!),
      photo: null,
      position: null,
    },
    statistics: {
      minutesPlayed: 78,
      position: null,
      rating: ratings[index] ?? null,
      captain: false,
      substitute: false,
      shotsTotal: 0,
      shotsOn: 0,
      goals: 0,
      goalsConceded: 0,
      assists: 0,
      saves: 0,
      passesTotal: 0,
      passesKey: 0,
      passesAccuracy: 0,
      tacklesTotal: 0,
      interceptions: 0,
      duelsTotal: 0,
      duelsWon: 0,
      dribblesAttempts: 0,
      dribblesSuccess: 0,
      foulsCommitted: 0,
      foulsDrawn: 0,
      yellowCards: index === 1 ? 1 : 0,
      redCards: 0,
      penaltiesScored: 0,
      penaltiesMissed: 0,
      penaltiesSaved: 0,
    },
  }));
}

function teamStatistics(
  team: typeof homeTeam,
  teamPlayers: MatchLineupPlayerDto[],
  color: string,
  values: {
    possession: number;
    shots: number;
    onTarget: number;
    passes: number;
    accuratePasses: number;
    xg: string;
  },
): MatchStatisticsTeamDto {
  return {
    team: {
      ...team,
      logo: null,
      playerColor: { primary: color, number: null, border: null },
    },
    teamStatistics: {
      shotsOnGoal: values.onTarget,
      shotsOffGoal: values.shots - values.onTarget - 2,
      totalShots: values.shots,
      blockedShots: 2,
      shotsInsideBox: values.shots - 4,
      shotsOutsideBox: 4,
      fouls: 8,
      cornerKicks: 5,
      offsides: 2,
      ballPossession: values.possession,
      yellowCards: 1,
      redCards: 0,
      goalkeeperSaves: 3,
      totalPasses: values.passes,
      passesAccurate: values.accuratePasses,
      passesAccuracyPercentage: Math.round(
        (values.accuratePasses / values.passes) * 100,
      ),
      goalsPrevented: 0,
      xg: [{ elapsed: 78, xg: values.xg }],
    },
    playerStatistics: playerStatistics(teamPlayers, [
      '7.1',
      '6.8',
      '7.3',
      '7.0',
      '6.9',
      '7.5',
      '7.4',
      '7.2',
      '7.0',
      '7.8',
      '8.1',
    ]),
  };
}

export const demoLeague: AvailableLeagueDto = {
  uid: 'demo-league',
  name: 'Demo League',
  shortName: 'DEMO',
  logo: null,
};

export const demoFixture: FixtureDto = {
  uid: fixtureUid,
  kickoff: null,
  round: 'Demo',
  homeTeam: {
    uid: homeTeam.teamUid,
    name: homeTeam.name,
    shortName: homeTeam.shortName,
    logo: null,
  },
  awayTeam: {
    uid: awayTeam.teamUid,
    name: awayTeam.name,
    shortName: awayTeam.shortName,
    logo: null,
  },
  status: { longStatus: 'Second Half', shortStatus: '2H', elapsed: 78 },
  score: { home: 2, away: 1 },
  available: true,
};

export const demoStatus: FixtureStatusDto = {
  fixtureUid,
  liveStatus: {
    elapsed: 78,
    shortStatus: '2H',
    longStatus: 'Second Half',
    score: { home: 2, away: 1 },
  },
};

export const demoLineup: FixtureLineupDto = {
  fixtureUid,
  lineup: {
    home: lineup(homeTeam, '4-3-3', homePlayers, '#3c7bff'),
    away: lineup(awayTeam, '4-3-3', awayPlayers, '#9d4058'),
  },
};

export const demoEvents: FixtureEventsDto = {
  fixtureUid,
  events: [
    {
      sequence: 1,
      elapsed: 18,
      extraTime: null,
      team: homeTeam,
      player: player(homePlayers, 9),
      assist: player(homePlayers, 11),
      type: 'Goal',
      detail: 'Normal Goal',
      comments: null,
    },
    {
      sequence: 2,
      elapsed: 37,
      extraTime: null,
      team: awayTeam,
      player: player(awayPlayers, 5),
      assist: null,
      type: 'Card',
      detail: 'Yellow Card',
      comments: null,
    },
    {
      sequence: 3,
      elapsed: 54,
      extraTime: null,
      team: awayTeam,
      player: player(awayPlayers, 9),
      assist: player(awayPlayers, 7),
      type: 'Goal',
      detail: 'Normal Goal',
      comments: null,
    },
    {
      sequence: 4,
      elapsed: 68,
      extraTime: null,
      team: homeTeam,
      player: player(homePlayers, 20),
      assist: player(homePlayers, 8),
      type: 'Subst',
      detail: 'Substitution 1',
      comments: null,
    },
    {
      sequence: 5,
      elapsed: 78,
      extraTime: null,
      team: homeTeam,
      player: player(homePlayers, 19),
      assist: player(homePlayers, 11),
      type: 'Goal',
      detail: 'Normal Goal',
      comments: null,
    },
  ],
};

export const demoStatistics: FixtureStatisticsDto = {
  fixture: { uid: fixtureUid, elapsed: 78, status: '2H' },
  home: teamStatistics(homeTeam, homePlayers, '#3c7bff', {
    possession: 58,
    shots: 15,
    onTarget: 7,
    passes: 612,
    accuratePasses: 548,
    xg: '2.14',
  }),
  away: teamStatistics(awayTeam, awayPlayers, '#9d4058', {
    possession: 42,
    shots: 10,
    onTarget: 4,
    passes: 438,
    accuratePasses: 371,
    xg: '1.21',
  }),
};
