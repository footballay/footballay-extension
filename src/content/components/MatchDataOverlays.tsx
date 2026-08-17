import { BarChart3, Flag, UsersRound } from 'lucide-react';
import { useState } from 'react';
import type {
  FixtureLineupDto,
  MatchLineupDto,
} from '@/shared/footballayApiProtocol';
import { useMatchPickerStore } from '@/content/stores/matchPickerStore';
import { useMatchDataStore } from '@/content/stores/matchDataStore';

type DetailTab = 'lineup' | 'statistics';
type TeamSide = 'home' | 'away';

const statisticDefinitions = [
  ['Possession', (value: number) => `${value}%`],
  ['xG', (value: number) => value.toFixed(1)],
  ['Shots', (value: number) => String(value)],
  ['Shots On Goal', (value: number) => String(value)],
  ['Corner Kicks', (value: number) => String(value)],
  ['Fouls', (value: number) => String(value)],
] as const;

function displayTeamName(team?: MatchLineupDto | null) {
  return team?.teamKoreanName ?? team?.teamName ?? '-';
}

function formationColumns(team?: MatchLineupDto | null) {
  if (!team) return [];

  const counts = (team.formation ?? '')
    .split('-')
    .map(Number)
    .filter((count) => Number.isInteger(count) && count > 0);
  const columns = [1, ...counts];
  const players = team.players.slice(0, columns.reduce((sum, count) => sum + count, 0));
  let offset = 0;

  return columns.map((count) => {
    const column = players.slice(offset, offset + count);
    offset += count;
    return column;
  });
}

function Lineup({ lineup }: { lineup?: FixtureLineupDto }) {
  const [teamSide, setTeamSide] = useState<TeamSide>('home');
  const teams = lineup?.lineup;
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
        <div className="footballay-match-panel__teams" role="tablist" aria-label="Lineup teams">
          {(['home', 'away'] as const).map((side) => (
            <button
              key={side}
              className={`footballay-match-panel__team footballay-match-panel__team--${side}`}
              type="button"
              role="tab"
              aria-selected={selectedTeamSide === side}
              disabled={!teams?.[side]}
              onClick={() => setTeamSide(side)}
            >
              {displayTeamName(teams?.[side])}
            </button>
          ))}
        </div>
      </div>
      <div className="footballay-match-panel__lineup" aria-label="Lineup players">
        {columns.length ? (
          columns.map((column, index) => (
            <div className="footballay-match-panel__line" key={index}>
              {column.map((player, playerIndex) => (
                <div className="footballay-match-panel__player" key={`${player.number}-${player.name}-${playerIndex}`}>
                  <span>{player.number ?? '-'}</span>
                  <strong>{player.koreanName ?? player.name}</strong>
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className="footballay-match-panel__empty">라인업 정보가 없습니다.</p>
        )}
      </div>
    </>
  );
}

function Statistics() {
  const statistics = useMatchDataStore((state) => state.statistics);
  const home = statistics?.home?.teamStatistics;
  const away = statistics?.away?.teamStatistics;

  const values: Array<[number, number]> | undefined = home && away
    ? [
        [home.ballPossession, away.ballPossession],
        [Number(home.xg.at(-1)?.xg ?? 0), Number(away.xg.at(-1)?.xg ?? 0)],
        [home.totalShots, away.totalShots],
        [home.shotsOnGoal, away.shotsOnGoal],
        [home.cornerKicks, away.cornerKicks],
        [home.fouls, away.fouls],
      ]
    : undefined;

  return (
    <>
      <div className="footballay-match-panel__topbar footballay-match-panel__topbar--statistics">
        <div className="footballay-match-panel__title"><span>Statistics</span></div>
      </div>
      <div className="footballay-match-panel__statistics">
        {values ? statisticDefinitions.map(([name, format], index) => {
          const [homeValue, awayValue] = values[index]!;
          const total = homeValue + awayValue || 1;
          return (
            <div className="footballay-match-panel__stat" key={name}>
              <span>{format(homeValue)}</span>
              <div>
                <strong>{name}</strong>
                <i><b style={{ width: `${(homeValue / total) * 100}%` }} /><em style={{ width: `${(awayValue / total) * 100}%` }} /></i>
              </div>
              <span>{format(awayValue)}</span>
            </div>
          );
        }) : <p className="footballay-match-panel__empty">팀 통계가 없습니다.</p>}
      </div>
    </>
  );
}

export function MatchDataOverlays() {
  const fixtureUid = useMatchPickerStore((state) => state.selectedFixtureUid);
  const lineup = useMatchDataStore((state) => state.lineup);
  const [tab, setTab] = useState<DetailTab>('lineup');

  if (!fixtureUid) return null;

  return (
    <aside className="footballay-match-panel" aria-label="Match panel">
      <div className="footballay-match-panel__tabs" role="tablist" aria-label="Match panel tabs">
        <button type="button" role="tab" aria-label="Lineup" aria-selected={tab === 'lineup'} onClick={() => setTab('lineup')}><UsersRound /></button>
        <button type="button" role="tab" aria-label="Statistics" aria-selected={tab === 'statistics'} onClick={() => setTab('statistics')}><BarChart3 /></button>
        <button type="button" aria-label="Events unavailable" disabled><Flag /></button>
      </div>
      <section className="footballay-match-panel__content">
        {tab === 'lineup' ? <Lineup lineup={lineup} /> : <Statistics />}
      </section>
    </aside>
  );
}
