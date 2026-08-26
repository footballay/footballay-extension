import { describe, expect, it } from 'vitest';
import {
  clusterPositionedEvents,
  matchMinuteToTimelineValue,
  positionTimelineEvents,
  type PositionedEvent,
} from './eventsTimelineLayout';

function event(
  x: number,
  sequence: number,
  side: 'home' | 'away' = 'home',
): PositionedEvent<number> {
  return {
    event: sequence,
    side,
    x,
    timelineValue: x,
    sequence,
    displayTime: `${x}'`,
  };
}

describe('events timeline layout', () => {
  it('places stoppage-time events at the end of each half', () => {
    expect(matchMinuteToTimelineValue(45, 3)).toBe(45);
    expect(matchMinuteToTimelineValue(90, 5)).toBe(90);
    expect(matchMinuteToTimelineValue(67, null)).toBe(67);
  });

  it('clusters by anchor pixel distance without chaining', () => {
    const clusters = clusterPositionedEvents(
      [event(100, 1), event(111, 2), event(120, 3), event(160, 4)],
      12,
    );

    expect(clusters.map((cluster) => cluster.events.map(({ x }) => x))).toEqual(
      [[100, 111], [120], [160]],
    );
  });

  it('clusters identical positions, separates sides, and keeps sequence order', () => {
    const clusters = clusterPositionedEvents(
      [event(50, 3), event(50, 1), event(50, 2, 'away')],
      12,
    );

    expect(clusters).toHaveLength(2);
    expect(clusters[0]?.events.map(({ sequence }) => sequence)).toEqual([1, 3]);
    expect(clusters[1]?.side).toBe('away');
  });

  it('uses the rendered timeline width when positioning events', () => {
    const input = [
      {
        event: 1,
        side: 'home' as const,
        timelineValue: 45,
        sequence: 1,
        displayTime: "45'",
      },
    ];

    expect(
      positionTimelineEvents(input, { min: 0, max: 90, width: 400 })[0]?.x,
    ).toBe(200);
    expect(
      positionTimelineEvents(input, { min: 0, max: 90, width: 500 })[0]?.x,
    ).toBe(250);
  });
});
