import { describe, expect, it } from 'vitest';
import { buildLineupTeam } from './lineupViewModel';
import type {
  FixtureEventsDto,
  MatchLineupDto,
  MatchStatisticsTeamDto,
} from '@/shared/api/dto';

const player = (matchPlayerUid: string, name = matchPlayerUid) => ({
  matchPlayerUid,
  playerUid: null,
  name,
  shortName: null,
  number: 1,
  photo: null,
  position: null,
  grid: null,
  substitute: false,
});

const team: MatchLineupDto = {
  teamUid: 'home',
  teamName: 'Home',
  teamShortName: null,
  formation: '1-1',
  players: [player('starter')],
  substitutes: [player('sub-1'), player('sub-2')],
  playerColor: null,
};

const event = (
  sequence: number,
  type: string,
  detail: string,
  playerUid?: string,
  assistUid?: string,
) => ({
  sequence,
  elapsed: 60,
  extraTime: null,
  team: { teamUid: 'home', name: 'Home', shortName: null, playerColor: null },
  player: playerUid
    ? {
        ...player(playerUid),
        photo: undefined,
        position: undefined,
        grid: undefined,
        substitute: undefined,
      }
    : null,
  assist: assistUid
    ? {
        ...player(assistUid),
        photo: undefined,
        position: undefined,
        grid: undefined,
        substitute: undefined,
      }
    : null,
  type,
  detail,
  comments: null,
});

describe('buildLineupTeam', () => {
  it('keeps only the current player in a substitution chain and decorates markers', () => {
    const events: FixtureEventsDto = {
      fixtureUid: 'fixture',
      events: [
        event(1, 'Subst', 'Substitution 1', 'sub-1', 'starter'),
        event(2, 'Subst', 'Substitution 2', 'sub-2', 'sub-1'),
        event(3, 'Goal', 'Normal Goal', 'sub-2'),
        event(4, 'Goal', 'Own Goal', 'sub-2'),
        event(5, 'ETC', 'Missed Penalty', 'sub-2'),
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

    const lineup = buildLineupTeam(team, events, statistics)!;
    const first = lineup.players[0]!;
    const current = first.replacement!.replacement!;

    expect(current.player.matchPlayerUid).toBe('sub-2');
    expect(current.subInTime).toBe("60'");
    expect(current).toMatchObject({
      goals: 1,
      ownGoals: 1,
      yellowCards: 1,
      redCards: 1,
      rating: '7.2',
    });
  });
});
