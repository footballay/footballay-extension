import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import { t } from "@/shared/i18n/locale";
import { buildMatchEventViewItems, type MatchEventViewItem } from "@/content/utils/matchEventViewModel";
import "@/content/styles/match-events-timeline.css";

type MatchEventsTimelineProps = {
  data: LiveMatchOverlayData | null;
  limit?: number;
};

export function MatchEventsTimeline({ data, limit = 12 }: MatchEventsTimelineProps) {
  const events = buildMatchEventViewItems(data?.events).slice(0, limit);

  if (!events.length) {
    return <p className="footballay-empty">{t("content.drawer.empty.events")}</p>;
  }

  return (
    <ol className="footballay-match-events" aria-label={t("content.drawer.events.title")}>
      {events.map((event) => (
        <li className={`footballay-match-event footballay-match-event--${event.variant}`} key={event.id}>
          <span className="footballay-match-event__minute">{event.minuteLabel}</span>
          <EventMarker event={event} />
          <span className="footballay-match-event__body">
            <span className="footballay-match-event__label">
              {event.labelKey ? t(event.labelKey) : event.fallbackLabel}
            </span>
            <span className="footballay-match-event__primary">{event.primaryText}</span>
            {event.secondaryText ? (
              <span className="footballay-match-event__secondary">{event.secondaryText}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

function EventMarker({ event }: { event: MatchEventViewItem }) {
  if (event.variant === "card") {
    return (
      <span
        aria-hidden
        className={`footballay-match-event__marker footballay-match-event__marker--card footballay-match-event__marker--${event.cardColor ?? "yellow"}`}
      />
    );
  }

  return <span aria-hidden className="footballay-match-event__marker" />;
}
