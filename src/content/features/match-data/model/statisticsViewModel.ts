import type {
  FixtureStatisticsDto,
  MatchStatisticsTeamDto,
} from '@/shared/api/dto';
import type { ContentMessageKey } from '@/shared/i18n/content';
import { resolveTeamColors } from '../util/teamColor';

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
  passAccuracy: { home: number | undefined; away: number | undefined };
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
    ['xG', xg],
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
  ],
];

function xg(team: MatchStatisticsTeamDto): number | string | null {
  const value: unknown = team.teamStatistics.xg.at(-1)?.xg;
  if (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '')
  ) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0
    ? (value as number | string)
    : null;
}

function displayTeamName(team: MatchStatisticsTeamDto): string {
  const shortName = team.team.shortName?.trim();
  return shortName || team.team.name;
}

function ratios(
  homeValue: number | string | null,
  awayValue: number | string | null,
) {
  const homeNumber = Number.parseFloat(String(homeValue));
  const awayNumber = Number.parseFloat(String(awayValue));
  const hasHomeNumber = Number.isFinite(homeNumber);
  const hasAwayNumber = Number.isFinite(awayNumber);

  if (!hasHomeNumber && !hasAwayNumber) {
    return { homeRatio: 0, awayRatio: 0 };
  }

  if (!hasHomeNumber) {
    return { homeRatio: 0, awayRatio: 100 };
  }

  if (!hasAwayNumber) {
    return { homeRatio: 100, awayRatio: 0 };
  }

  const total = homeNumber + awayNumber || 1;

  return {
    homeRatio: Math.round((homeNumber / total) * 1000) / 10,
    awayRatio: Math.round((awayNumber / total) * 1000) / 10,
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

function passAccuracy(team: MatchStatisticsTeamDto): number | undefined {
  const { passesAccuracyPercentage, passesAccurate, totalPasses } =
    team.teamStatistics;
  if (
    Number.isFinite(passesAccuracyPercentage) &&
    passesAccuracyPercentage > 0 &&
    passesAccuracyPercentage <= 100
  ) {
    return passesAccuracyPercentage;
  }

  if (
    !Number.isFinite(passesAccurate) ||
    !Number.isFinite(totalPasses) ||
    passesAccurate <= 0 ||
    totalPasses <= 0 ||
    passesAccurate > totalPasses
  ) {
    return undefined;
  }

  return Math.round((passesAccurate / totalPasses) * 100);
}

export function buildStatisticsViewModel(
  statistics: FixtureStatisticsDto | undefined,
): StatisticsViewModel | undefined {
  const home = statistics?.home;
  const away = statistics?.away;
  if (!home || !away) return undefined;

  return {
    homeTeamName: displayTeamName(home),
    awayTeamName: displayTeamName(away),
    colors: resolveTeamColors(home.team, away.team),
    passAccuracy: {
      home: passAccuracy(home),
      away: passAccuracy(away),
    },
    cards: {
      homeYellow: home.teamStatistics.yellowCards,
      homeRed: home.teamStatistics.redCards,
      awayYellow: away.teamStatistics.yellowCards,
      awayRed: away.teamStatistics.redCards,
    },
    columns: STATISTIC_COLUMNS.map((column) =>
      column
        .map(([label, value]) => buildRow(label, value, home, away))
        .filter(
          (row) =>
            row.label !== 'xG' ||
            row.homeValue !== null ||
            row.awayValue !== null,
        ),
    ),
  };
}
