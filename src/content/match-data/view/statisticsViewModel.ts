import type {
  FixtureStatisticsDto,
  MatchStatisticsTeamDto,
} from '@/shared/api/dto';
import type { ContentMessageKey } from '@/shared/i18n/content';
import { resolveTeamColors } from './teamColor';

export type StatisticLabel = ContentMessageKey | 'xG';

export type StatisticRow = {
  label: StatisticLabel;
  homeValue: number | string | null;
  awayValue: number | string | null;
  homeRatio: number;
  awayRatio: number;
};

export type StatisticsViewModel = {
  homeTeamName: string;
  awayTeamName: string;
  colors: { home: string; away: string };
  passAccuracy: { home: number; away: number };
  cards: {
    homeYellow: number;
    homeRed: number;
    awayYellow: number;
    awayRed: number;
  };
  columns: StatisticRow[][];
};

type StatisticDefinition = [
  StatisticLabel,
  (team: MatchStatisticsTeamDto) => number | string | null,
];

const STATISTIC_COLUMNS: StatisticDefinition[][] = [
  [
    ['totalPasses', (team) => team.teamStatistics.totalPasses],
    ['passesAccurate', (team) => team.teamStatistics.passesAccurate],
    [
      'possession',
      (team) =>
        typeof team.teamStatistics.ballPossession === 'number'
          ? `${team.teamStatistics.ballPossession}%`
          : null,
    ],
  ],
  [
    ['totalShots', (team) => team.teamStatistics.totalShots],
    ['shotsOnGoal', (team) => team.teamStatistics.shotsOnGoal],
    ['xG', (team) => team.teamStatistics.xg.at(-1)?.xg ?? '0'],
    ['fouls', (team) => team.teamStatistics.fouls],
    ['cornerKicks', (team) => team.teamStatistics.cornerKicks],
    ['offsides', (team) => team.teamStatistics.offsides],
  ],
  [
    ['shotsOffGoal', (team) => team.teamStatistics.shotsOffGoal],
    ['blockedShots', (team) => team.teamStatistics.blockedShots],
    ['shotsInsideBox', (team) => team.teamStatistics.shotsInsideBox],
    ['shotsOutsideBox', (team) => team.teamStatistics.shotsOutsideBox],
    ['goalkeeperSaves', (team) => team.teamStatistics.goalkeeperSaves],
    ['goalsPrevented', (team) => team.teamStatistics.goalsPrevented],
  ],
];

function ratios(
  homeValue: number | string | null,
  awayValue: number | string | null,
) {
  const homeNumber = Number.parseFloat(String(homeValue));
  const awayNumber = Number.parseFloat(String(awayValue));
  const total =
    Number.isFinite(homeNumber) && Number.isFinite(awayNumber)
      ? homeNumber + awayNumber || 1
      : 1;

  return {
    homeRatio: Number.isFinite(homeNumber)
      ? Math.round((homeNumber / total) * 1000) / 10
      : 0,
    awayRatio: Number.isFinite(awayNumber)
      ? Math.round((awayNumber / total) * 1000) / 10
      : 0,
  };
}

function buildRow(
  label: StatisticLabel,
  value: StatisticDefinition[1],
  home: MatchStatisticsTeamDto,
  away: MatchStatisticsTeamDto,
): StatisticRow {
  const homeValue = value(home);
  const awayValue = value(away);
  return {
    label,
    homeValue,
    awayValue,
    ...ratios(homeValue, awayValue),
  };
}

export function buildStatisticsViewModel(
  statistics: FixtureStatisticsDto | undefined,
): StatisticsViewModel | undefined {
  const home = statistics?.home;
  const away = statistics?.away;
  if (!home || !away) return undefined;

  return {
    homeTeamName: home.team.name,
    awayTeamName: away.team.name,
    colors: resolveTeamColors(home.team, away.team),
    passAccuracy: {
      home: home.teamStatistics.passesAccuracyPercentage,
      away: away.teamStatistics.passesAccuracyPercentage,
    },
    cards: {
      homeYellow: home.teamStatistics.yellowCards,
      homeRed: home.teamStatistics.redCards,
      awayYellow: away.teamStatistics.yellowCards,
      awayRed: away.teamStatistics.redCards,
    },
    columns: STATISTIC_COLUMNS.map((column) =>
      column.map(([label, value]) => buildRow(label, value, home, away)),
    ),
  };
}
