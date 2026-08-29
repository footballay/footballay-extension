import {
  useMatchPanel,
  type StatisticLabel,
  type StatisticRow,
} from '@/content/features/match-data';
import { t, useContentLocale, type ContentLocale } from '@/shared/i18n/content';
import './statistics-tab.css';

function statisticName(locale: ContentLocale, label: StatisticLabel) {
  return label === 'xG' ? 'xG' : t(locale, label);
}

export function StatisticsTab() {
  const locale = useContentLocale();
  const { statistics } = useMatchPanel();
  const view = statistics.data;

  return (
    <>
      <div className="footballay-match-panel__topbar footballay-match-panel__topbar--statistics">
        <div className="footballay-match-panel__title">
          <span>{t(locale, 'statistics')}</span>
        </div>
      </div>
      <div className="footballay-match-panel__statistics">
        {statistics.loadStatus === 'error' ? (
          <p className="footballay-match-panel__empty" role="alert">
            {t(locale, 'statisticsError', {
              error: statistics.error ?? '',
            })}
          </p>
        ) : view ? (
          view.columns.map((column, index) => (
            <div
              className={`footballay-match-panel__statistics-column footballay-match-panel__statistics-column--${index}`}
              key={index}
            >
              {index === 0 && (
                <PassAccuracy
                  homeName={view.homeTeamName}
                  awayName={view.awayTeamName}
                  homeValue={view.passAccuracy.home}
                  awayValue={view.passAccuracy.away}
                  homeColor={view.colors.home}
                  awayColor={view.colors.away}
                />
              )}
              {index === 1 && <Cards cards={view.cards} />}
              {column.map((statistic) => (
                <Statistic
                  key={statistic.label}
                  statistic={statistic}
                  name={statisticName(locale, statistic.label)}
                  homeColor={view.colors.home}
                  awayColor={view.colors.away}
                />
              ))}
            </div>
          ))
        ) : (
          <p className="footballay-match-panel__empty">
            {statistics.loadStatus === 'loading'
              ? t(locale, 'loading')
              : t(locale, 'noStatistics')}
          </p>
        )}
      </div>
    </>
  );
}

function PassAccuracy({
  homeName,
  awayName,
  homeValue,
  awayValue,
  homeColor,
  awayColor,
}: {
  homeName: string;
  awayName: string;
  homeValue: number | undefined;
  awayValue: number | undefined;
  homeColor: string;
  awayColor: string;
}) {
  const teams = [
    { name: homeName, value: homeValue, color: homeColor },
    { name: awayName, value: awayValue, color: awayColor },
  ];

  return (
    <div className="footballay-match-panel__pass-accuracy">
      {teams.map((team) => (
        <div key={team.name}>
          <strong>{team.name}</strong>
          <i
            style={{
              background: `radial-gradient(circle, var(--footballay-color-surface-raised) 0 15px, transparent 16px), conic-gradient(${team.color} ${team.value ?? 0}%, var(--footballay-color-disabled) 0)`,
            }}
          >
            {team.value === undefined ? null : `${team.value}%`}
          </i>
        </div>
      ))}
    </div>
  );
}

function Cards({
  cards,
}: {
  cards: {
    homeYellow: number;
    homeRed: number;
    awayYellow: number;
    awayRed: number;
  };
}) {
  return (
    <div className="footballay-match-panel__cards">
      <span>
        {cards.homeYellow} / {cards.homeRed}
      </span>
      <span className="footballay-match-panel__card-types">
        <i className="footballay-match-panel__card footballay-match-panel__card--yellow" />
        <i className="footballay-match-panel__card footballay-match-panel__card--red" />
      </span>
      <span>
        {cards.awayYellow} / {cards.awayRed}
      </span>
    </div>
  );
}

function Statistic({
  statistic,
  name,
  homeColor,
  awayColor,
}: {
  statistic: StatisticRow;
  name: string;
  homeColor: string;
  awayColor: string;
}) {
  if (
    statistic.label !== 'xG' &&
    (statistic.homeValue === null || statistic.awayValue === null)
  ) {
    return null;
  }

  return (
    <div className="footballay-match-panel__stat">
      <span>{statistic.homeValue}</span>
      <div>
        <strong>{name}</strong>
        <i
          className={
            statistic.homeRatio === 0 && statistic.awayRatio === 0
              ? 'footballay-match-panel__stat-track--empty'
              : undefined
          }
        >
          <b
            style={{
              flex: `0 0 ${statistic.homeRatio}%`,
              background: homeColor,
            }}
          />
          <em
            style={{
              flex: `0 0 ${statistic.awayRatio}%`,
              background: awayColor,
            }}
          />
        </i>
      </div>
      <span>{statistic.awayValue}</span>
    </div>
  );
}
