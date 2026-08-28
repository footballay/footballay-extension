import type {
  FixtureLineupDto,
  FixtureStatisticsDto,
  MatchLineupPlayerDto,
  MatchStatisticsTeamDto,
} from '@/shared/api/dto';

function createLineupPlayer(
  matchPlayerUid: string,
  name: string,
  number: number,
): MatchLineupPlayerDto {
  return {
    matchPlayerUid,
    playerUid: null,
    name,
    shortName: null,
    number,
    photo: null,
    position: null,
    grid: null,
    substitute: false,
  };
}

export function createFixtureLineup(
  overrides: Partial<FixtureLineupDto> = {},
): FixtureLineupDto {
  return {
    fixtureUid: 'fixture-1',
    lineup: {
      home: {
        teamUid: 'home-team',
        teamName: '홈',
        teamShortName: null,
        formation: '4-2-3-1',
        players: [createLineupPlayer('home-player-1', 'Home Player', 1)],
        substitutes: [],
        playerColor: null,
      },
      away: {
        teamUid: 'away-team',
        teamName: '원정',
        teamShortName: null,
        formation: '4-3-3',
        players: [createLineupPlayer('away-player-2', 'Away Player', 2)],
        substitutes: [],
        playerColor: null,
      },
    },
    ...overrides,
  };
}

function createStatisticsTeam(
  teamUid: string,
  name: string,
  shortName: string | null,
  ballPossession: number,
): MatchStatisticsTeamDto {
  return {
    team: { teamUid, name, shortName, logo: null, playerColor: null },
    teamStatistics: {
      shotsOnGoal: ballPossession === 55 ? 4 : 2,
      shotsOffGoal: ballPossession === 55 ? 3 : 4,
      totalShots: ballPossession === 55 ? 10 : 8,
      blockedShots: ballPossession === 55 ? 3 : 2,
      shotsInsideBox: ballPossession === 55 ? 6 : 4,
      shotsOutsideBox: 4,
      fouls: ballPossession === 55 ? 7 : 5,
      cornerKicks: ballPossession === 55 ? 3 : 1,
      offsides: 0,
      ballPossession,
      yellowCards: 0,
      redCards: 0,
      goalkeeperSaves: ballPossession === 55 ? 1 : 2,
      totalPasses: ballPossession === 55 ? 100 : 90,
      passesAccurate: ballPossession === 55 ? 80 : 70,
      passesAccuracyPercentage: ballPossession === 55 ? 80 : 78,
      goalsPrevented: 0,
      xg: [{ elapsed: 45, xg: ballPossession === 55 ? '1.4' : '0.9' }],
    },
    playerStatistics: [],
  };
}

export function createFixtureStatistics(
  overrides: Partial<FixtureStatisticsDto> = {},
): FixtureStatisticsDto {
  return {
    fixture: { uid: 'fixture-1', elapsed: 45, status: 'HT' },
    home: createStatisticsTeam('home-team', '홈', null, 55),
    away: createStatisticsTeam('away-team', '원정', null, 45),
    ...overrides,
  };
}
