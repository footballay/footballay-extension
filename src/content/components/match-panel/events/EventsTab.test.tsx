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
});
