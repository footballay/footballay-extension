import type { MatchStatisticsTeamDto } from '@/shared/api/dto';
import { useMatchDataStore } from '@/content/stores/matchDataStore';
import { t, useContentLocale, type ContentLocale } from '@/shared/i18n/content';
import { resolveTeamColors } from '../shared/teamColor';
import './statistics-tab.css';

type StatisticDefinition = [
  string,
  (team: MatchStatisticsTeamDto) => number | string | null,
];

function statisticColumns(locale: ContentLocale): StatisticDefinition[][] {
  return [
    [
      [t(locale, 'totalPasses'), (team) => team.teamStatistics.totalPasses],
      [
        t(locale, 'passesAccurate'),
        (team) => team.teamStatistics.passesAccurate,
      ],
      [
        t(locale, 'possession'),
        (team) =>
          typeof team.teamStatistics.ballPossession === 'number'
            ? `${team.teamStatistics.ballPossession}%`
            : null,
      ],
    ],
    [
      [t(locale, 'totalShots'), (team) => team.teamStatistics.totalShots],
      [t(locale, 'shotsOnGoal'), (team) => team.teamStatistics.shotsOnGoal],
      ['xG', (team) => team.teamStatistics.xg.at(-1)?.xg ?? '0'],
      [t(locale, 'fouls'), (team) => team.teamStatistics.fouls],
      [t(locale, 'cornerKicks'), (team) => team.teamStatistics.cornerKicks],
      [t(locale, 'offsides'), (team) => team.teamStatistics.offsides],
    ],
    [
      [t(locale, 'shotsOffGoal'), (team) => team.teamStatistics.shotsOffGoal],
      [t(locale, 'blockedShots'), (team) => team.teamStatistics.blockedShots],
      [
        t(locale, 'shotsInsideBox'),
        (team) => team.teamStatistics.shotsInsideBox,
      ],
      [
        t(locale, 'shotsOutsideBox'),
        (team) => team.teamStatistics.shotsOutsideBox,
      ],
      [
        t(locale, 'goalkeeperSaves'),
        (team) => team.teamStatistics.goalkeeperSaves,
      ],
      [
        t(locale, 'goalsPrevented'),
        (team) => team.teamStatistics.goalsPrevented,
      ],
    ],
  ];
}

export function StatisticsTab() {
  const locale = useContentLocale();
  const statisticsResource = useMatchDataStore((state) => state.statistics);
  const statistics = statisticsResource.data;
  const home = statistics?.home;
  const away = statistics?.away;
  const teamColors =
    home && away ? resolveTeamColors(home.team, away.team) : undefined;

  return (
    <>
      <div className="footballay-match-panel__topbar footballay-match-panel__topbar--statistics">
        <div className="footballay-match-panel__title">
          <span>{t(locale, 'statistics')}</span>
        </div>
      </div>
      <div className="footballay-match-panel__statistics">
        {statisticsResource.loadStatus === 'error' ? (
          <p className="footballay-match-panel__empty" role="alert">
            {t(locale, 'statisticsError', {
              error: statisticsResource.error ?? '',
            })}
          </p>
        ) : home && away ? (
          statisticColumns(locale).map((column, index) => (
            <div
              className={`footballay-match-panel__statistics-column footballay-match-panel__statistics-column--${index}`}
              key={index}
            >
              {index === 0 && (
                <PassAccuracy home={home} away={away} colors={teamColors!} />
              )}
              {index === 1 && <Cards home={home} away={away} />}
              {column.map(([name, value]) => (
                <Statistic
                  key={name}
                  name={name}
                  homeValue={value(home)}
                  awayValue={value(away)}
                  homeColor={teamColors!.home}
                  awayColor={teamColors!.away}
                />
              ))}
            </div>
          ))
        ) : (
          <p className="footballay-match-panel__empty">
            {statisticsResource.loadStatus === 'loading'
              ? t(locale, 'loading')
              : t(locale, 'noStatistics')}
          </p>
        )}
      </div>
    </>
  );
}

function PassAccuracy({
  home,
  away,
  colors,
}: {
  home: MatchStatisticsTeamDto;
  away: MatchStatisticsTeamDto;
  colors: { home: string; away: string };
}) {
  return (
    <div className="footballay-match-panel__pass-accuracy">
      {[home, away].map((team, index) => {
        const value = team.teamStatistics.passesAccuracyPercentage;
        return (
          <div key={team.team.teamUid}>
            <strong>{team.team.name}</strong>
            <i
              style={{
                background: `radial-gradient(circle, var(--footballay-color-surface-raised) 0 15px, transparent 16px), conic-gradient(${index === 0 ? colors.home : colors.away} ${value}%, var(--footballay-color-disabled) 0)`,
              }}
            >
              {value}%
            </i>
          </div>
        );
      })}
    </div>
  );
}

function Cards({
  home,
  away,
}: {
  home: MatchStatisticsTeamDto;
  away: MatchStatisticsTeamDto;
}) {
  return (
    <div className="footballay-match-panel__cards">
      <span>
        {home.teamStatistics.yellowCards} / {home.teamStatistics.redCards}
      </span>
      <span className="footballay-match-panel__card-types">
        <i className="footballay-match-panel__card footballay-match-panel__card--yellow" />
        <i className="footballay-match-panel__card footballay-match-panel__card--red" />
      </span>
      <span>
        {away.teamStatistics.yellowCards} / {away.teamStatistics.redCards}
      </span>
    </div>
  );
}

function Statistic({
  name,
  homeValue,
  awayValue,
  homeColor,
  awayColor,
}: {
  name: string;
  homeValue: number | string | null;
  awayValue: number | string | null;
  homeColor: string;
  awayColor: string;
}) {
  if (homeValue === null || awayValue === null) return null;
  const homeNumber = Number.parseFloat(String(homeValue));
  const awayNumber = Number.parseFloat(String(awayValue));
  const total =
    Number.isFinite(homeNumber) && Number.isFinite(awayNumber)
      ? homeNumber + awayNumber || 1
      : 1;
  const homeRatio = Number.isFinite(homeNumber)
    ? Math.round((homeNumber / total) * 1000) / 10
    : 0;
  const awayRatio = Number.isFinite(awayNumber)
    ? Math.round((awayNumber / total) * 1000) / 10
    : 0;

  return (
    <div className="footballay-match-panel__stat">
      <span>{homeValue}</span>
      <div>
        <strong>{name}</strong>
        <i
          className={
            homeRatio === 0 && awayRatio === 0
              ? 'footballay-match-panel__stat-track--empty'
              : undefined
          }
        >
          <b style={{ flex: `0 0 ${homeRatio}%`, background: homeColor }} />
          <em style={{ flex: `0 0 ${awayRatio}%`, background: awayColor }} />
        </i>
      </div>
      <span>{awayValue}</span>
    </div>
  );
}
