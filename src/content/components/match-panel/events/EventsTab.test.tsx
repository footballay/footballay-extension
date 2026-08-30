// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DisplayEvent } from '@/content/features/match-data';

const eventView = vi.hoisted(() => ({
  events: {
    data: {
      events: [] as DisplayEvent[],
      max: 90 as const,
    },
    loadStatus: 'ready' as const,
  },
}));

vi.mock('@/content/features/match-data', () => ({
  useMatchPanel: () => eventView,
}));

import { EventsTab } from './EventsTab';

function event(kind: DisplayEvent['kind'], sequence: number): DisplayEvent {
  return {
    sequence,
    elapsed: 20 + sequence,
    extraTime: null,
    team: { teamUid: 'home', name: 'Home', shortName: null, playerColor: null },
    player: {
      matchPlayerUid: `${kind}-in`,
      playerUid: null,
      name: `${kind} player`,
      shortName: null,
      number: null,
    },
    assist: {
      matchPlayerUid: `${kind}-out`,
      playerUid: null,
      name: `${kind} assist`,
      shortName: null,
      number: null,
    },
    type: kind === 'substitution' ? 'Subst' : 'Goal',
    detail: kind === 'substitution' ? 'Substitution' : 'Normal Goal',
    comments: null,
    kind,
    displayTime: "20'",
    timelineValue: 20,
  };
}

describe('EventsTab', () => {
  it('labels substitution players as IN and OUT without changing goal assists', () => {
    eventView.events.data.events = [event('substitution', 1), event('goal', 2)];

    render(<EventsTab />);

    expect(screen.getByText('IN: substitution player')).toBeTruthy();
    expect(screen.getByText('OUT: substitution assist')).toBeTruthy();
    expect(screen.queryByText('Assist: substitution assist')).toBeNull();
    expect(screen.getByText('Assist: goal assist')).toBeTruthy();
  });

  it('uses the own-goal marker only for own goals', () => {
    const ownGoal = event('goal', 2);
    ownGoal.detail = 'Own Goal';
    eventView.events.data.events = [event('goal', 1), ownGoal];

    const { container } = render(<EventsTab />);

    const markers = container.querySelectorAll(
      '.footballay-match-panel__event-marker--goal img',
    );
    expect(markers).toHaveLength(2);
    expect(markers[0]?.getAttribute('src')).not.toBe(
      markers[1]?.getAttribute('src'),
    );
    expect(
      container.querySelector(
        '.footballay-match-panel__event-tooltip-title--own-goal',
      )?.textContent,
    ).toBe('Own goal');
  });
});
