import { ArrowUp } from 'lucide-react';
import { useState } from 'react';
import goalMarker from '../../../../../assets/goal_marker.png';
import {
  useMatchPanel,
  type LineupPlayer,
  type LineupTeamView,
} from '@/content/features/match-data';
import { t, useContentLocale, type ContentLocale } from '@/shared/i18n/content';
import './lineup-tab.css';

type TeamSide = 'home' | 'away';

function displayTeamName(team?: LineupTeamView) {
  return team?.teamName ?? '-';
}

function PlayerMarkers({
  player,
  locale,
}: {
  player: LineupPlayer;
  locale: ContentLocale;
}) {
  const rating = Number(player.rating);
  return (
    <div className="footballay-match-panel__markers">
      {player.subInTime && (
        <span className="footballay-match-panel__sub-in">
          <ArrowUp
            aria-label={t(locale, 'substitutedIn', { time: player.subInTime })}
          />
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
            aria-label={t(locale, 'yellowCard')}
          />
        ))}
        {Array.from({ length: player.redCards }, (_, index) => (
          <i
            className="footballay-match-panel__card footballay-match-panel__card--red"
            key={`red-${index}`}
            aria-label={t(locale, 'redCard')}
          />
        ))}
      </span>
      <span className="footballay-match-panel__goals">
        {Array.from({ length: player.goals }, (_, index) => (
          <img src={goalMarker} alt={t(locale, 'goal')} key={`goal-${index}`} />
        ))}
        {Array.from({ length: player.ownGoals }, (_, index) => (
          <img
            src={goalMarker}
            alt={t(locale, 'ownGoal')}
            key={`own-goal-${index}`}
          />
        ))}
      </span>
    </div>
  );
}

export function LineupTab() {
  const locale = useContentLocale();
  const { lineup } = useMatchPanel();
  const [teamSide, setTeamSide] = useState<TeamSide>('home');
  const teams = {
    home: lineup.data.home,
    away: lineup.data.away,
  };
  const selectedTeamSide: TeamSide = teams[teamSide]
    ? teamSide
    : teams.home
      ? 'home'
      : 'away';
  const team = teams[selectedTeamSide];
  const columns = team?.columns ?? [];

  return (
    <>
      <div className="footballay-match-panel__topbar">
        <div className="footballay-match-panel__title">
          <span>{t(locale, 'lineup')}</span>
          <strong>{team?.formation ?? '-'}</strong>
        </div>
        <div
          className="footballay-match-panel__teams"
          role="tablist"
          aria-label={t(locale, 'lineupTeams')}
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
                        ? teams[side].color
                        : 'var(--footballay-color-red)',
                    }
                  : {
                      borderRightColor: teams[side]
                        ? teams[side].color
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
        aria-label={t(locale, 'lineupPlayers')}
      >
        {lineup.loadStatus === 'error' ? (
          <p className="footballay-match-panel__empty" role="alert">
            {t(locale, 'lineupError', { error: lineup.error ?? '' })}
          </p>
        ) : columns.length ? (
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
                    <strong title={player.player.name}>
                      {player.displayName}
                    </strong>
                  </div>
                  <PlayerMarkers player={player} locale={locale} />
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className="footballay-match-panel__empty">
            {lineup.loadStatus === 'loading'
              ? t(locale, 'loading')
              : t(locale, 'noLineup')}
          </p>
        )}
      </div>
    </>
  );
}
