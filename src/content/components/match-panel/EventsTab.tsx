import { ArrowDownUp } from 'lucide-react';
import { useRef } from 'react';
import type { MatchEventDto } from '@/shared/footballayApiProtocol';
import { useMatchDataStore } from '@/content/stores/matchDataStore';
import { resolveTeamColors } from '../shared/teamColor';
import goalMarker from '../../../../assets/goal_marker.png';
import './events-tab.css';

type DisplayEvent = MatchEventDto & { kind: 'goal' | 'card' | 'substitution' };

function eventKind(event: MatchEventDto): DisplayEvent['kind'] | undefined {
  if (event.type === 'Goal') return 'goal';
  if (event.type === 'Subst') return 'substitution';
  if (/card/i.test(event.type) || /card/i.test(event.detail)) return 'card';
}

function eventTime(event: MatchEventDto) {
  return `${event.elapsed}${event.extraTime ? `+${event.extraTime}` : ''}'`;
}

function displayName(name: { name: string; koreanName: string | null }) {
  return name.koreanName ?? name.name;
}

export function EventsTab() {
  const events = useMatchDataStore((state) => state.events?.events ?? []);
  const statistics = useMatchDataStore((state) => state.statistics);
  const displayEvents = events.flatMap((event) => {
    const kind = eventKind(event);
    return kind ? [{ ...event, kind }] : [];
  });
  const home = statistics?.home?.team ?? displayEvents[0]?.team;
  const away =
    statistics?.away?.team ??
    displayEvents.find((event) => event.team.teamUid !== home?.teamUid)?.team;
  const colors = resolveTeamColors(home, away);

  return (
    <>
      <div className="footballay-match-panel__topbar">
        <div className="footballay-match-panel__title footballay-match-panel__title--events">
          <span>Events</span>
        </div>
      </div>
      <div className="footballay-match-panel__events">
        {home && (
          <TeamTitle side="home" name={displayName(home)} color={colors.home} />
        )}
        <Timeline events={displayEvents} homeTeamUid={home?.teamUid} />
        {away && (
          <TeamTitle side="away" name={displayName(away)} color={colors.away} />
        )}
        {!home && !away && (
          <p className="footballay-match-panel__empty">
            이벤트 데이터가 없습니다.
          </p>
        )}
      </div>
    </>
  );
}

function TeamTitle({
  side,
  name,
  color,
}: {
  side: 'home' | 'away';
  name: string;
  color: string;
}) {
  return (
    <div
      className={`footballay-match-panel__event-team footballay-match-panel__event-team--${side}`}
    >
      <i style={{ background: color }} />
      {name}
    </div>
  );
}

function Timeline({
  events,
  homeTeamUid,
}: {
  events: DisplayEvent[];
  homeTeamUid?: string;
}) {
  return (
    <div
      className="footballay-match-panel__timeline"
      aria-label="Match events timeline"
    >
      <div className="footballay-match-panel__timeline-line" />
      {[15, 30, 45, 60, 75, 90].map((minute) => (
        <span
          className={`footballay-match-panel__timeline-tick footballay-match-panel__timeline-tick--${minute}`}
          key={minute}
        >
          {minute}'
        </span>
      ))}
      {events.map((event) => (
        <EventMarker
          key={event.sequence}
          event={event}
          up={event.team.teamUid === homeTeamUid}
        />
      ))}
    </div>
  );
}

function EventMarker({ event, up }: { event: DisplayEvent; up: boolean }) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const left = `${(Math.min(event.elapsed, 90) / 90) * 100}%`;
  const yellow = /yellow/i.test(event.detail);

  function showTooltip({ clientX, clientY }: React.PointerEvent) {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;
    tooltip.style.left = `${Math.min(clientX + 12, window.innerWidth - 158)}px`;
    tooltip.style.top = `${Math.min(clientY + 12, window.innerHeight - 66)}px`;
    if (!tooltip.matches(':popover-open')) tooltip.showPopover();
  }

  function hideTooltip() {
    const tooltip = tooltipRef.current;
    if (tooltip?.matches(':popover-open')) tooltip.hidePopover();
  }

  return (
    <div
      className={`footballay-match-panel__event footballay-match-panel__event--${up ? 'up' : 'down'}`}
      style={{ left }}
      onPointerMove={showTooltip}
      onPointerLeave={hideTooltip}
    >
      <span className="footballay-match-panel__event-time">
        {eventTime(event)}
      </span>
      <i className="footballay-match-panel__event-stem" />
      {event.kind === 'goal' ? (
        <span className="footballay-match-panel__event-marker footballay-match-panel__event-marker--goal">
          <img src={goalMarker} alt="Goal" />
        </span>
      ) : event.kind === 'card' ? (
        <b
          className={`footballay-match-panel__event-marker ${yellow ? 'footballay-match-panel__card--yellow' : 'footballay-match-panel__card--red'}`}
        />
      ) : (
        <span className="footballay-match-panel__event-marker footballay-match-panel__event-marker--substitution">
          <ArrowDownUp aria-hidden="true" />
        </span>
      )}
      <div
        className="footballay-match-panel__event-tooltip"
        popover="manual"
        ref={tooltipRef}
      >
        <span>
          {eventTime(event)}{' '}
          <strong>
            {event.kind === 'substitution' ? 'Substitution' : event.type}
          </strong>
        </span>
        <b>{event.player ? displayName(event.player) : '-'}</b>
        {event.assist && <small>Assist : {displayName(event.assist)}</small>}
      </div>
    </div>
  );
}
