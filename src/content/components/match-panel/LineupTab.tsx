import { ArrowUp } from 'lucide-react';
import { useState } from 'react';
import goalMarker from '../../../../assets/goal_marker.png';
import type { FixtureLineupDto } from '@/shared/footballayApiProtocol';
import {
  buildLineupTeam,
  type LineupPlayer,
  type LineupTeam,
} from '@/content/mappers/lineupViewModel';
import { useMatchDataStore } from '@/content/stores/matchDataStore';
import { resolveTeamColors } from '../shared/teamColor';
import './lineup-tab.css';

type TeamSide = 'home' | 'away';

function displayTeamName(team?: LineupTeam) {
  return team?.teamKoreanName ?? team?.teamName ?? '-';
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
          <img src={goalMarker} alt="Goal" key={`goal-${index}`} />
        ))}
        {Array.from({ length: player.ownGoals }, (_, index) => (
          <img src={goalMarker} alt="Own goal" key={`own-goal-${index}`} />
        ))}
      </span>
    </div>
  );
}

export function LineupTab({ lineup }: { lineup?: FixtureLineupDto }) {
  const [teamSide, setTeamSide] = useState<TeamSide>('home');
  const events = useMatchDataStore((state) => state.events);
  const statistics = useMatchDataStore((state) => state.statistics);
  const teams = {
    home: buildLineupTeam(lineup?.lineup.home, events, statistics?.home),
    away: buildLineupTeam(lineup?.lineup.away, events, statistics?.away),
  };
  const teamColors = resolveTeamColors(teams.home, teams.away);
  const selectedTeamSide: TeamSide = teams[teamSide] ? teamSide : 'away';
  const team = teams[selectedTeamSide];
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
              disabled={!teams[side]}
              onClick={() => setTeamSide(side)}
              style={
                side === 'home'
                  ? {
                      borderLeftColor: teams[side]
                        ? teamColors.home
                        : 'var(--footballay-color-red)',
                    }
                  : {
                      borderRightColor: teams[side]
                        ? teamColors.away
                        : 'var(--footballay-color-blue)',
                    }
              }
            >
              {displayTeamName(teams[side])}
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
