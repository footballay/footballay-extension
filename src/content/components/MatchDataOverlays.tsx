import { ArrowUp, BarChart3, CircleDot, Flag, UsersRound } from 'lucide-react';
import { useState } from 'react';
import type {
  FixtureLineupDto,
  MatchStatisticsTeamDto,
} from '@/shared/footballayApiProtocol';
import { useMatchPickerStore } from '@/content/stores/matchPickerStore';
import { useMatchDataStore } from '@/content/stores/matchDataStore';
import {
  buildLineupTeam,
  type LineupPlayer,
  type LineupTeam,
} from '@/content/mappers/lineupViewModel';

type DetailTab = 'lineup' | 'statistics';
type TeamSide = 'home' | 'away';

type StatisticDefinition = [
  string,
  (team: MatchStatisticsTeamDto) => number | string | null,
];

const statisticColumns: StatisticDefinition[][] = [
  [
    ['Total Passes', (team) => team.teamStatistics.totalPasses],
    ['Passes Acc', (team) => team.teamStatistics.passesAccurate],
    [
      'Possession',
      (team) =>
        typeof team.teamStatistics.ballPossession === 'number'
          ? `${team.teamStatistics.ballPossession}%`
          : null,
    ],
  ],
  [
    ['Shots', (team) => team.teamStatistics.totalShots],
    ['Shots on goal', (team) => team.teamStatistics.shotsOnGoal],
    ['xG', (team) => team.teamStatistics.xg.at(-1)?.xg ?? '0'],
    ['Fouls', (team) => team.teamStatistics.fouls],
    ['Corner Kicks', (team) => team.teamStatistics.cornerKicks],
    ['Offsides', (team) => team.teamStatistics.offsides],
  ],
  [
    ['Shots Off Goal', (team) => team.teamStatistics.shotsOffGoal],
    ['Blocked Shots', (team) => team.teamStatistics.blockedShots],
    ['Shots Inside Box', (team) => team.teamStatistics.shotsInsideBox],
    ['Shots Outside Box', (team) => team.teamStatistics.shotsOutsideBox],
    ['Corner Kicks', (team) => team.teamStatistics.cornerKicks],
    ['Offsides', (team) => team.teamStatistics.offsides],
  ],
];

function displayTeamName(team?: LineupTeam) {
  return team?.teamKoreanName ?? team?.teamName ?? '-';
}

function teamColor(
  team: { playerColor: { primary: string } | null },
  fallback: string,
) {
  const color = team.playerColor?.primary.trim();
  if (!color) return fallback;
  if (/^#[\da-f]{3,8}$/i.test(color)) return color;
  return /^[\da-f]{3,8}$/i.test(color) ? `#${color}` : fallback;
}

function currentPlayer(player: LineupPlayer): LineupPlayer {
  return player.replacement ? currentPlayer(player.replacement) : player;
}

function formationColumns(team?: LineupTeam) {
  if (!team) return [];

  const counts = (team.formation ?? '')
    .split('-')
    .map(Number)
    .filter((count) => Number.isInteger(count) && count > 0);
  const columns = [1, ...counts];
  const players = team.players
    .slice(
      0,
      columns.reduce((sum, count) => sum + count, 0),
    )
    .map(currentPlayer);
  let offset = 0;

  return columns.map((count) => {
    const column = players.slice(offset, offset + count);
    offset += count;
    return column;
  });
}

function PlayerMarkers({ player }: { player: LineupPlayer }) {
  const rating = Number(player.rating);
  return (
    <div className="footballay-match-panel__markers">
      {player.subInTime && (
        <span className="footballay-match-panel__sub-in">
          <ArrowUp aria-label={`Substituted in ${player.subInTime}`} />
        </span>
      )}
      {player.rating && (
        <span
          className={`footballay-match-panel__rating footballay-match-panel__rating--${rating >= 7 ? 'good' : 'low'}`}
        >
          {player.rating}
        </span>
      )}
      <span className="footballay-match-panel__player-cards">
        {Array.from({ length: player.yellowCards }, (_, index) => (
          <i
            className="footballay-match-panel__card footballay-match-panel__card--yellow"
            key={`yellow-${index}`}
            aria-label="Yellow card"
          />
        ))}
        {Array.from({ length: player.redCards }, (_, index) => (
          <i
            className="footballay-match-panel__card footballay-match-panel__card--red"
            key={`red-${index}`}
            aria-label="Red card"
          />
        ))}
      </span>
      <span className="footballay-match-panel__goals">
        {Array.from({ length: player.goals }, (_, index) => (
          <CircleDot key={`goal-${index}`} aria-label="Goal" />
        ))}
        {Array.from({ length: player.ownGoals }, (_, index) => (
          <CircleDot
            className="footballay-match-panel__own-goal"
            key={`own-goal-${index}`}
            aria-label="Own goal"
          />
        ))}
      </span>
    </div>
  );
}

function Lineup({ lineup }: { lineup?: FixtureLineupDto }) {
  const [teamSide, setTeamSide] = useState<TeamSide>('home');
  const events = useMatchDataStore((state) => state.events);
  const statistics = useMatchDataStore((state) => state.statistics);
  const teams = {
    home: buildLineupTeam(lineup?.lineup.home, events, statistics?.home),
    away: buildLineupTeam(lineup?.lineup.away, events, statistics?.away),
  };
  const selectedTeamSide: TeamSide = teams?.[teamSide] ? teamSide : 'away';
  const team = teams?.[selectedTeamSide];
  const columns = formationColumns(team);

  return (
    <>
      <div className="footballay-match-panel__topbar">
        <div className="footballay-match-panel__title">
          <span>Lineup</span>
          <strong>{team?.formation ?? '-'}</strong>
        </div>
        <div
          className="footballay-match-panel__teams"
          role="tablist"
          aria-label="Lineup teams"
        >
          {(['home', 'away'] as const).map((side) => (
            <button
              key={side}
              className={`footballay-match-panel__team footballay-match-panel__team--${side}`}
              type="button"
              role="tab"
              aria-selected={selectedTeamSide === side}
              disabled={!teams?.[side]}
              onClick={() => setTeamSide(side)}
              style={
                side === 'home'
                  ? {
                      borderLeftColor: teams[side]
                        ? teamColor(teams[side], '#ff5151')
                        : '#ff5151',
                    }
                  : {
                      borderRightColor: teams[side]
                        ? teamColor(teams[side], '#3cbeff')
                        : '#3cbeff',
                    }
              }
            >
              {displayTeamName(teams?.[side])}
            </button>
          ))}
        </div>
      </div>
      <div
        className="footballay-match-panel__lineup"
        aria-label="Lineup players"
      >
        {columns.length ? (
          columns.map((column, index) => (
            <div className="footballay-match-panel__line" key={index}>
              {column.map((player, playerIndex) => (
                <div
                  className="footballay-match-panel__player"
                  key={
                    player.player.matchPlayerUid ||
                    `${player.player.number}-${player.player.name}-${playerIndex}`
                  }
                >
                  <div className="footballay-match-panel__player-main">
                    <span>{player.player.number ?? '-'}</span>
                    <strong>
                      {player.player.koreanName ?? player.player.name}
                    </strong>
                  </div>
                  <PlayerMarkers player={player} />
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className="footballay-match-panel__empty">
            라인업 정보가 없습니다.
          </p>
        )}
      </div>
    </>
  );
}

function Statistics() {
  const statistics = useMatchDataStore((state) => state.statistics);
  const home = statistics?.home;
  const away = statistics?.away;

  return (
    <>
      <div className="footballay-match-panel__topbar footballay-match-panel__topbar--statistics">
        <div className="footballay-match-panel__title">
          <span>Statistics</span>
        </div>
      </div>
      <div className="footballay-match-panel__statistics">
        {home && away ? (
          statisticColumns.map((column, index) => (
            <div
              className={`footballay-match-panel__statistics-column footballay-match-panel__statistics-column--${index}`}
              key={index}
            >
              {index === 0 && <PassAccuracy home={home} away={away} />}
              {index === 1 && <Cards home={home} away={away} />}
              {column.map(([name, value]) => (
                <Statistic
                  key={name}
                  name={name}
                  homeValue={value(home)}
                  awayValue={value(away)}
                  homeColor={teamColor(home.team, '#ff5151')}
                  awayColor={teamColor(away.team, '#3cbeff')}
                />
              ))}
            </div>
          ))
        ) : (
          <p className="footballay-match-panel__empty">
            통계 데이터가 없습니다.
          </p>
        )}
      </div>
    </>
  );
}

function PassAccuracy({
  home,
  away,
}: {
  home: MatchStatisticsTeamDto;
  away: MatchStatisticsTeamDto;
}) {
  return (
    <div className="footballay-match-panel__pass-accuracy">
      {[home, away].map((team, index) => {
        const value = team.teamStatistics.passesAccuracyPercentage;
        return (
          <div key={team.team.teamUid}>
            <strong>{team.team.koreanName ?? team.team.name}</strong>
            <i
              style={{
                background: `radial-gradient(circle, #2d333c 0 15px, transparent 16px), conic-gradient(${teamColor(team.team, index === 0 ? '#ff5151' : '#3cbeff')} ${value}%, #5c6470 0)`,
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
          <b
            style={{
              flex: `0 0 ${homeRatio}%`,
              background: homeColor,
            }}
          />
          <em
            style={{
              flex: `0 0 ${awayRatio}%`,
              background: awayColor,
            }}
          />
        </i>
      </div>
      <span>{awayValue}</span>
    </div>
  );
}

export function MatchDataOverlays() {
  const fixtureUid = useMatchPickerStore((state) => state.selectedFixtureUid);
  const lineup = useMatchDataStore((state) => state.lineup);
  const [tab, setTab] = useState<DetailTab>('lineup');

  if (!fixtureUid) return null;

  return (
    <aside className="footballay-match-panel" aria-label="Match panel">
      <div
        className="footballay-match-panel__tabs"
        role="tablist"
        aria-label="Match panel tabs"
      >
        <button
          type="button"
          role="tab"
          aria-label="Lineup"
          aria-selected={tab === 'lineup'}
          onClick={() => setTab('lineup')}
        >
          <UsersRound />
        </button>
        <button
          type="button"
          role="tab"
          aria-label="Statistics"
          aria-selected={tab === 'statistics'}
          onClick={() => setTab('statistics')}
        >
          <BarChart3 />
        </button>
        <button type="button" aria-label="Events unavailable" disabled>
          <Flag />
        </button>
      </div>
      <section className="footballay-match-panel__content">
        {tab === 'lineup' ? <Lineup lineup={lineup} /> : <Statistics />}
      </section>
    </aside>
  );
}
