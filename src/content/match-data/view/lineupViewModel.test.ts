import { describe, expect, it } from 'vitest';
import type {
  FixtureEventsDto,
  FixtureLineupDto,
  MatchEventDto,
  MatchLineupPlayerDto,
  MatchStatisticsTeamDto,
} from '@/shared/api/dto';
import { buildLineupViewModel } from './lineupViewModel';

function player(matchPlayerUid: string): MatchLineupPlayerDto {
  return {
    matchPlayerUid,
    playerUid: null,
    name: matchPlayerUid,
    shortName: null,
    number: 1,
    photo: null,
    position: null,
    grid: null,
    substitute: false,
  };
}

function event(
  sequence: number,
  type: string,
  detail: string,
  playerUid?: string,
  assistUid?: string,
): MatchEventDto {
  return {
    sequence,
    elapsed: 60,
    extraTime: null,
    team: { teamUid: 'home', name: 'Home', shortName: null, playerColor: null },
    player: playerUid ? player(playerUid) : null,
    assist: assistUid ? player(assistUid) : null,
    type,
    detail,
    comments: null,
  };
}

describe('buildLineupViewModel', () => {
  it('builds the current formation player with substitution and match markers', () => {
    const lineup: FixtureLineupDto = {
      fixtureUid: 'fixture',
      lineup: {
        home: {
          teamUid: 'home',
          teamName: 'Home',
          teamShortName: null,
          formation: '1-1',
          players: [player('starter')],
          substitutes: [player('sub-1'), player('sub-2')],
          playerColor: {
            primary: 'ff0000',
            number: null,
            border: null,
          },
        },
        away: null,
      },
    };
    const events: FixtureEventsDto = {
      fixtureUid: 'fixture',
      events: [
        event(1, 'Subst', 'Substitution 1', 'sub-1', 'starter'),
        event(2, 'Subst', 'Substitution 2', 'sub-2', 'sub-1'),
        event(3, 'Goal', 'Normal Goal', 'sub-2'),
        event(4, 'Goal', 'Own Goal', 'sub-2'),
      ],
    };
    const statistics = {
      playerStatistics: [
        {
          player: player('sub-2'),
          statistics: { yellowCards: 1, redCards: 1, rating: '7.2' },
        },
      ],
    } as unknown as MatchStatisticsTeamDto;

    const view = buildLineupViewModel(lineup, events, {
      fixture: { uid: 'fixture', elapsed: 60, status: '2H' },
      home: statistics,
      away: null,
    });
    const starter = view.home!.players[0]!;
    const current = view.home!.columns[0]![0]!;

    expect(starter.replacement?.replacement).toBe(current);
    expect(current).toMatchObject({
      player: { matchPlayerUid: 'sub-2' },
      subInTime: "60'",
      goals: 1,
      ownGoals: 1,
      yellowCards: 1,
      redCards: 1,
      rating: '7.2',
    });
    expect(view.home!.columns).toHaveLength(3);
    expect(view.home!.color).toBe('#ff0000');
  });
});
