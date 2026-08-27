import { useEffect, useRef, useState } from 'react';
import type { MatchEventDto } from '@/shared/footballayApiProtocol';
import { useMatchDataStore } from '@/content/stores/matchDataStore';
import { resolveTeamColors } from '../shared/teamColor';
import substituteMarker from '../../../../assets/events_substitute_marker.png';
import goalMarker from '../../../../assets/goal_marker.png';
import {
  clusterPositionedEvents,
  clusterTime,
  matchMinuteToTimelineValue,
  positionTimelineEvents,
  timelineMax,
  type EventCluster,
  type TimelineSide,
} from './eventsTimelineLayout';
import './events-tab.css';

type DisplayEvent = MatchEventDto & { kind: 'goal' | 'card' | 'substitution' };

const EVENT_CLUSTER_WINDOW_PX = 22;

function eventKind(event: MatchEventDto): DisplayEvent['kind'] | undefined {
  if (event.type === 'Goal') return 'goal';
  if (event.type === 'Subst') return 'substitution';
  if (/card/i.test(event.type) || /card/i.test(event.detail)) return 'card';
}

function eventTime(event: MatchEventDto) {
  return `${event.elapsed}${event.extraTime ? `+${event.extraTime}` : ''}'`;
}

function timelineValue(event: MatchEventDto) {
  return matchMinuteToTimelineValue(event.elapsed, event.extraTime);
}

function displayName(name: { name: string; koreanName: string | null }) {
  return name.koreanName ?? name.name;
}

export function EventsTab() {
  const status = useMatchDataStore((state) => state.status);
  const events = useMatchDataStore((state) => state.events?.events) ?? [];
  const statistics = useMatchDataStore((state) => state.statistics);
  const displayEvents = events.flatMap((event) => {
    if (event.elapsed < 0) return [];
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
            {status === 'loading' ? '데이터 불러오는 중' : '이벤트 데이터가 없습니다.'}
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
  const timelineRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const max = timelineMax(events);

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const updateWidth = () => setWidth(timeline.getBoundingClientRect().width);
    updateWidth();
    if (!globalThis.ResizeObserver) return;
    const observer = new ResizeObserver(updateWidth);
    observer.observe(timeline);
    return () => observer.disconnect();
  }, []);

  const positionedEvents = positionTimelineEvents(
    events.map((event) => ({
      event,
      side: (event.team.teamUid === homeTeamUid
        ? 'home'
        : 'away') as TimelineSide,
      timelineValue: timelineValue(event),
      sequence: event.sequence,
      displayTime: eventTime(event),
    })),
    { min: 0, max, width },
  );
  const clusters = clusterPositionedEvents(
    positionedEvents,
    EVENT_CLUSTER_WINDOW_PX,
  );

  return (
    <div
      className="footballay-match-panel__timeline"
      aria-label="Match events timeline"
      ref={timelineRef}
    >
      <div className="footballay-match-panel__timeline-line" />
      {Array.from({ length: max / 15 }, (_, index) => (index + 1) * 15).map(
        (minute) => (
          <span
            className={`footballay-match-panel__timeline-tick footballay-match-panel__timeline-tick--${minute}`}
            key={minute}
            style={{ left: `${(minute / max) * 100}%` }}
          >
            {minute}'
          </span>
        ),
      )}
      {clusters.map((cluster) => (
        <EventClusterMarker
          cluster={cluster}
          key={`${cluster.side}-${cluster.events[0]?.sequence}`}
        />
      ))}
    </div>
  );
}

function markerSize(event: DisplayEvent) {
  return event.kind === 'goal'
    ? { width: 17, height: 17 }
    : event.kind === 'card'
      ? { width: 8, height: 11 }
      : { width: 14, height: 14 };
}

function EventClusterMarker({
  cluster,
}: {
  cluster: EventCluster<DisplayEvent>;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const visibleEvents = cluster.events.slice(0, 3);
  const stackedEvents = [...visibleEvents].sort(
    ({ event: a }, { event: b }) => {
      const aSize = markerSize(a);
      const bSize = markerSize(b);
      return aSize.width * aSize.height - bSize.width * bSize.height;
    },
  );
  const markerWidth = Math.max(
    ...visibleEvents.map(({ event }) => markerSize(event).width),
  );
  const markerHeight = Math.max(
    ...visibleEvents.map(({ event }) => markerSize(event).height),
  );
  const stackOffset =
    visibleEvents.length > 1 ? (visibleEvents.length - 1) * 3 : 0;
  const markerBoxHeight = markerHeight + stackOffset;
  const markerGap = visibleEvents.some(({ event }) => event.kind === 'goal')
    ? 0
    : 2;
  const up = cluster.side === 'home';
  const top = up ? 22 - (12 + markerBoxHeight + markerGap + 30) : 22;

  function showTooltip({ clientX, clientY }: React.PointerEvent) {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;
    if (!tooltip.matches(':popover-open')) tooltip.showPopover();
    const bounds = tooltip.getBoundingClientRect();
    tooltip.style.left = `${Math.max(0, Math.min(clientX + 12, window.innerWidth - bounds.width))}px`;
    tooltip.style.top = `${Math.max(0, Math.min(clientY + 12, window.innerHeight - bounds.height))}px`;
  }

  function hideTooltip() {
    const tooltip = tooltipRef.current;
    if (tooltip?.matches(':popover-open')) tooltip.hidePopover();
  }

  return (
    <div
      className={`footballay-match-panel__event footballay-match-panel__event--${up ? 'up' : 'down'}`}
      style={{
        left: `${cluster.anchorX}px`,
        top: `${top}px`,
      }}
      onPointerMove={showTooltip}
      onPointerLeave={hideTooltip}
    >
      <span className="footballay-match-panel__event-time">
        {clusterTime(cluster)}
      </span>
      <i className="footballay-match-panel__event-stem" />
      <span
        className={`footballay-match-panel__event-markers${markerGap === 0 ? ' footballay-match-panel__event-markers--flush' : ''}`}
        style={{
          width: `${markerWidth + stackOffset}px`,
          height: `${markerBoxHeight}px`,
        }}
      >
        {stackedEvents.map(({ event }, index) => (
          <EventGlyph event={event} index={index} key={event.sequence} />
        ))}
        {cluster.events.length > 3 && (
          <small className="footballay-match-panel__event-count">
            ×{cluster.events.length}
          </small>
        )}
      </span>
      <div
        className="footballay-match-panel__event-tooltip"
        popover="manual"
        ref={tooltipRef}
      >
        {cluster.events.map(({ event, displayTime }) => (
          <div
            className="footballay-match-panel__event-tooltip-item"
            key={event.sequence}
          >
            <span>
              {displayTime}{' '}
              <strong>
                {event.kind === 'substitution' ? 'Substitution' : event.type}
              </strong>
            </span>
            <b>{event.player ? displayName(event.player) : '-'}</b>
            {event.assist && (
              <small>Assist : {displayName(event.assist)}</small>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EventGlyph({ event, index }: { event: DisplayEvent; index: number }) {
  const style = { left: `${index * 3}px`, top: `${index * 3}px` };

  if (event.kind === 'goal') {
    return (
      <span
        className="footballay-match-panel__event-marker footballay-match-panel__event-marker--goal"
        style={style}
      >
        <img src={goalMarker} alt="" />
      </span>
    );
  }

  if (event.kind === 'card') {
    return (
      <b
        className={`footballay-match-panel__event-marker ${/yellow/i.test(event.detail) ? 'footballay-match-panel__card--yellow' : 'footballay-match-panel__card--red'}`}
        style={style}
      />
    );
  }

  return (
    <span
      className="footballay-match-panel__event-marker footballay-match-panel__event-marker--substitution"
      style={style}
    >
      <img src={substituteMarker} alt="" />
    </span>
  );
}
