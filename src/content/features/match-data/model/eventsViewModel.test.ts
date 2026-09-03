import { describe, expect, it } from 'vitest';
import type { FixtureDto, MatchEventDto } from '@/shared/api/dto';
import { buildEventsViewModel } from './eventsViewModel';

const fixtureInfo: FixtureDto = {
  uid: 'fixture',
  kickoff: null,
  round: 'Regular Season',
  homeTeam: { uid: 'home', name: 'Home', shortName: null, logo: null },
  awayTeam: { uid: 'away', name: 'Away', shortName: null, logo: null },
  status: { longStatus: 'Not Started', shortStatus: 'NS', elapsed: null },
  score: { home: null, away: null },
  available: true,
};

function event(
  sequence: number,
  elapsed: number,
  extraTime: number | null,
  teamUid: string,
  type: string,
  detail: string,
): MatchEventDto {
  return {
    sequence,
    elapsed,
    extraTime,
    team: {
      teamUid,
      name: teamUid === 'home' ? 'Home' : 'Away',
      shortName: null,
      playerColor: null,
    },
    player: null,
    assist: null,
    type,
    detail,
    comments: null,
  };
}

describe('buildEventsViewModel', () => {
  it('filters display events and derives teams, time, timeline value, and max', () => {
    const view = buildEventsViewModel(
      {
        fixtureUid: 'fixture',
        events: [
          event(1, 45, 2, 'home', 'Goal', 'Normal Goal'),
          event(2, 91, 1, 'away', 'Subst', 'Substitution'),
          event(3, 20, null, 'home', 'Card', 'Yellow Card'),
          event(4, 30, null, 'home', 'ETC', 'Missed Penalty'),
          event(5, -1, null, 'away', 'Goal', 'Normal Goal'),
        ],
      },
      undefined,
      fixtureInfo,
    );

    expect(view.events.map(({ kind }) => kind)).toEqual([
      'goal',
      'substitution',
      'card',
    ]);
    expect(view.events[0]).toMatchObject({
      displayTime: "45+2'",
      timelineValue: 45,
    });
    expect(view.events[1]).toMatchObject({
      displayTime: "91+1'",
      timelineValue: 91,
    });
    expect(view.home).toMatchObject({ teamUid: 'home', name: 'Home' });
    expect(view.away).toMatchObject({ teamUid: 'away', name: 'Away' });
    expect(view.max).toBe(120);
  });

  it('uses fixture teams when the first event belongs to the away team', () => {
    const view = buildEventsViewModel(
      {
        fixtureUid: 'fixture',
        events: [
          event(1, 10, null, 'away', 'Goal', 'Normal Goal'),
          event(2, 20, null, 'home', 'Card', 'Yellow Card'),
        ],
      },
      undefined,
      fixtureInfo,
    );

    expect(view.home).toMatchObject({ teamUid: 'home', name: 'Home' });
    expect(view.away).toMatchObject({ teamUid: 'away', name: 'Away' });
  });
});
