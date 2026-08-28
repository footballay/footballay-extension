import { describe, expect, it } from 'vitest';
import type { MatchEventDto } from '@/shared/api/dto';
import { getMatchEventKind } from './matchEvent';

function event(type: string, detail: string): MatchEventDto {
  return {
    sequence: 0,
    elapsed: 45,
    extraTime: null,
    team: {
      teamUid: 'scoring-team',
      name: 'Team',
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

describe('getMatchEventKind', () => {
  it('keeps own goals as goals and excludes Core-normalized missed penalties', () => {
    expect(getMatchEventKind(event('Goal', 'Own Goal'))).toBe('goal');
    expect(getMatchEventKind(event('ETC', 'Missed Penalty'))).toBe(
      'missed-penalty',
    );
  });
});
