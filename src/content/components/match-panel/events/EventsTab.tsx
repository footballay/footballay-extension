import { useEffect, useRef, useState } from 'react';
import {
  useMatchPanel,
  type DisplayEvent,
} from '@/content/features/match-data';
import { t, useContentLocale, type ContentLocale } from '@/shared/i18n/content';
import substituteMarker from '../../../../../assets/events_substitute_marker.png';
import goalMarker from '../../../../../assets/goal_marker.png';
import {
  clusterPositionedEvents,
  clusterTime,
  positionTimelineEvents,
  type EventCluster,
  type TimelineSide,
} from './eventsTimelineLayout';
import './events-tab.css';

const EVENT_CLUSTER_WINDOW_PX = 22;
const TOOLTIP_POINTER_OFFSET_PX = 12;
const MARKER_STACK_ORDER: Record<DisplayEvent['kind'], number> = {
  card: 0,
  substitution: 1,
  goal: 2,
};

export function EventsTab() {
  const locale = useContentLocale();
  const { events } = useMatchPanel();
  const view = events.data;

  return (
    <>
      <div className="footballay-match-panel__topbar">
        <div className="footballay-match-panel__title footballay-match-panel__title--events">
          <span>{t(locale, 'events')}</span>
        </div>
      </div>
      <div className="footballay-match-panel__events">
        {view.home && (
          <TeamTitle
            side="home"
            name={view.home.name}
            color={view.home.color}
          />
        )}
        <Timeline
          events={view.events}
          homeTeamUid={view.home?.teamUid}
          max={view.max}
          locale={locale}
        />
        {view.away && (
          <TeamTitle
            side="away"
            name={view.away.name}
            color={view.away.color}
          />
        )}
        {events.loadStatus === 'error' && (
          <p className="footballay-match-panel__empty" role="alert">
            {t(locale, 'eventsError', { error: events.error ?? '' })}
          </p>
        )}
        {events.loadStatus === 'loading' && !view.home && !view.away && (
          <p className="footballay-match-panel__empty">
            {t(locale, 'loading')}
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
  max,
  locale,
}: {
  events: DisplayEvent[];
  homeTeamUid?: string;
  max: 90 | 120;
  locale: ContentLocale;
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

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
      timelineValue: event.timelineValue,
      sequence: event.sequence,
      displayTime: event.displayTime,
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
      aria-label={t(locale, 'matchEventsTimeline')}
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
          locale={locale}
        />
      ))}
    </div>
  );
}

function EventClusterMarker({
  cluster,
  locale,
}: {
  cluster: EventCluster<DisplayEvent>;
  locale: ContentLocale;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const visibleEvents = cluster.events.slice(0, 3);
  const stackedEvents = [...visibleEvents].sort(
    ({ event: a }, { event: b }) =>
      MARKER_STACK_ORDER[a.kind] - MARKER_STACK_ORDER[b.kind],
  );
  const flushMarkers = visibleEvents.some(({ event }) => event.kind === 'goal');
  const up = cluster.side === 'home';

  function showTooltip({ clientX, clientY }: React.PointerEvent) {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;
    if (!tooltip.matches(':popover-open')) tooltip.showPopover();
    const bounds = tooltip.getBoundingClientRect();
    tooltip.style.left = `${Math.max(0, Math.min(clientX + TOOLTIP_POINTER_OFFSET_PX, window.innerWidth - bounds.width))}px`;
    tooltip.style.top = `${Math.max(0, Math.min(clientY + TOOLTIP_POINTER_OFFSET_PX, window.innerHeight - bounds.height))}px`;
  }

  function hideTooltip() {
    const tooltip = tooltipRef.current;
    if (tooltip?.matches(':popover-open')) tooltip.hidePopover();
  }

  return (
    <div
      className={`footballay-match-panel__event footballay-match-panel__event--${up ? 'up' : 'down'}`}
      style={{ left: `${cluster.anchorX}px` }}
      onPointerMove={showTooltip}
      onPointerLeave={hideTooltip}
    >
      <span className="footballay-match-panel__event-time">
        {clusterTime(cluster)}
      </span>
      <i className="footballay-match-panel__event-stem" />
      <span
        className={`footballay-match-panel__event-markers${flushMarkers ? ' footballay-match-panel__event-markers--flush' : ''}`}
        data-stacked={visibleEvents.length}
      >
        {stackedEvents.map(({ event }) => (
          <EventGlyph event={event} key={event.sequence} />
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
        {cluster.events.map(({ event }) => (
          <div
            className="footballay-match-panel__event-tooltip-item"
            key={event.sequence}
          >
            <span>
              {event.displayTime}{' '}
              <strong>
                {event.kind === 'substitution'
                  ? t(locale, 'substitution')
                  : event.type}
              </strong>
            </span>
            {event.kind === 'substitution' ? (
              <>
                <small>IN: {event.player?.name ?? '-'}</small>
                {event.assist && <small>OUT: {event.assist.name}</small>}
              </>
            ) : (
              <>
                <b>{event.player?.name ?? '-'}</b>
                {event.assist && (
                  <small>
                    {t(locale, 'assist')}: {event.assist.name}
                  </small>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EventGlyph({ event }: { event: DisplayEvent }) {
  if (event.kind === 'goal') {
    return (
      <span className="footballay-match-panel__event-marker footballay-match-panel__event-marker--goal">
        <img src={goalMarker} alt="" />
      </span>
    );
  }

  if (event.kind === 'card') {
    return (
      <b
        className={`footballay-match-panel__event-marker ${/yellow/i.test(event.detail) ? 'footballay-match-panel__card--yellow' : 'footballay-match-panel__card--red'}`}
      />
    );
  }

  return (
    <span className="footballay-match-panel__event-marker footballay-match-panel__event-marker--substitution">
      <img src={substituteMarker} alt="" />
    </span>
  );
}
