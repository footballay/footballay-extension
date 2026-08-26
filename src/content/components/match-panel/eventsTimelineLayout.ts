export type TimelineSide = 'home' | 'away';

export type TimelineEvent<T> = {
  event: T;
  side: TimelineSide;
  timelineValue: number;
  sequence: number;
  displayTime: string;
};

export type PositionedEvent<T> = TimelineEvent<T> & { x: number };

export type EventCluster<T> = {
  side: TimelineSide;
  anchorX: number;
  minX: number;
  maxX: number;
  events: PositionedEvent<T>[];
};

export type TimelineScale = { min: number; max: number; width: number };

export function matchMinuteToTimelineValue(
  elapsed: number,
  extraTime: number | null,
) {
  if (extraTime === null) return elapsed;
  return elapsed <= 45 ? 45 : 90;
}

export function timelineValueToX(value: number, scale: TimelineScale) {
  if (scale.max <= scale.min || scale.width <= 0) return 0;
  return Math.min(
    scale.width,
    Math.max(0, ((value - scale.min) / (scale.max - scale.min)) * scale.width),
  );
}

export function positionTimelineEvents<T>(
  events: TimelineEvent<T>[],
  scale: TimelineScale,
) {
  return events.map((event) => ({
    ...event,
    x: timelineValueToX(event.timelineValue, scale),
  }));
}

export function clusterPositionedEvents<T>(
  events: PositionedEvent<T>[],
  windowPx: number,
) {
  const clusters: EventCluster<T>[] = [];

  for (const side of ['home', 'away'] as const) {
    const sorted = events
      .filter((event) => event.side === side)
      .sort((a, b) => a.x - b.x || a.sequence - b.sequence);
    let cluster: EventCluster<T> | undefined;

    for (const event of sorted) {
      if (!cluster || event.x - cluster.anchorX > windowPx) {
        cluster = {
          side,
          anchorX: event.x,
          minX: event.x,
          maxX: event.x,
          events: [event],
        };
        clusters.push(cluster);
      } else {
        cluster.maxX = event.x;
        cluster.events.push(event);
      }
    }
  }

  return clusters;
}
