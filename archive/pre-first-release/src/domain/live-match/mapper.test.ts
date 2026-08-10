import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AvailableLeagueResponse,
  FixtureByLeagueResponse,
  FixtureEventsResponse,
  FixtureInfoResponse,
  FixtureLineupResponse,
  FixtureLiveStatusResponse,
  FixtureStatisticsResponse
} from "./backendTypes";
import { mapAvailableLeague, mapFixtureLiveData, mapFixtureSummary } from "./mapper";

describe("live match mapper", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-05T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps available league responses", () => {
    const response: AvailableLeagueResponse = {
      uid: "league-1",
      name: "Premier League",
      nameKo: "프리미어리그"
    };

    expect(mapAvailableLeague(response)).toEqual({
      uid: "league-1",
      name: "Premier League",
      nameKo: "프리미어리그"
    });
  });

  it("maps fixture summaries with display names and scores", () => {
    const response: FixtureByLeagueResponse = {
      available: true,
      awayTeam: { name: "Away", nameKo: "어웨이" },
      homeTeam: { name: "Home", nameKo: "홈" },
      kickoff: "2026-05-25T10:00:00Z",
      round: "Regular Season - 1",
      score: { away: 1, home: 2 },
      status: {
        elapsed: 90,
        longStatus: "Match Finished",
        shortStatus: "FT"
      },
      uid: "fixture-1"
    };

    expect(mapFixtureSummary(response)).toEqual({
      available: true,
      awayScore: 1,
      awayTeamName: "어웨이",
      elapsed: 90,
      homeScore: 2,
      homeTeamName: "홈",
      kickoff: "2026-05-25T10:00:00Z",
      round: "Regular Season - 1",
      statusLong: "Match Finished",
      statusShort: "FT",
      uid: "fixture-1"
    });
  });

  it("maps live match snapshot including stats, top players, events, and lineup", () => {
    const info: FixtureInfoResponse = {
      away: {
        teamUid: "away",
        name: "Away",
        koreanName: "어웨이",
        playerColor: {
          border: "3050b8",
          number: "ebcc2d",
          primary: "3050b8"
        }
      },
      date: "2026-05-25T10:00:00Z",
      fixtureUid: "fixture-1",
      home: {
        teamUid: "home",
        name: "Home",
        koreanName: "홈",
        playerColor: {
          border: "74112e",
          number: "ffffff",
          primary: "74112e"
        }
      },
      league: { leagueUid: "league-1", name: "League" }
    };
    const status: FixtureLiveStatusResponse = {
      fixtureUid: "fixture-1",
      liveStatus: {
        elapsed: 68,
        longStatus: "Second Half",
        score: { away: 1, home: 2 },
        shortStatus: "2H"
      }
    };
    const statistics: FixtureStatisticsResponse = {
      away: createTeamStatistics("away-player", "Away Star", "7.2", 1),
      fixture: {
        status: "2H",
        uid: "fixture-1"
      },
      home: createTeamStatistics("lineup-1", "Home Star", "8.4", 2)
    };
    const events: FixtureEventsResponse = {
      fixtureUid: "fixture-1",
      events: [
        {
          assist: { matchPlayerUid: "assist-1", name: "Assist", koreanName: "도움" },
          comments: null,
          detail: "Normal Goal",
          elapsed: 12,
          extraTime: null,
          player: { matchPlayerUid: "player-1", name: "Scorer", koreanName: "득점자" },
          sequence: 1,
          team: { teamUid: "home", name: "Home", koreanName: "홈" },
          type: "Goal"
        }
      ]
    };
    const lineup: FixtureLineupResponse = {
      fixtureUid: "fixture-1",
      lineup: {
        home: {
          formation: "4-3-3",
          players: [
            {
              grid: "1:1",
              matchPlayerUid: "lineup-1",
              name: "Keeper",
              koreanName: "골키퍼",
              number: 1,
              position: "G",
              substitute: false
            }
          ],
          substitutes: [],
          teamName: "Home",
          teamKoreanName: "홈",
          teamUid: "home"
        }
      }
    };

    const mapped = mapFixtureLiveData(info, status, statistics, events, lineup);

    expect(mapped).toMatchObject({
      awayScore: 1,
      awayTeamName: "어웨이",
      elapsed: 68,
      fixtureUid: "fixture-1",
      homeScore: 2,
      homeTeamColor: {
        border: "#74112e",
        number: "#ffffff",
        primary: "#74112e"
      },
      homeTeamName: "홈",
      awayTeamColor: {
        border: "#3050b8",
        number: "#ebcc2d",
        primary: "#3050b8"
      },
      statusShort: "2H",
      updatedAt: "2026-06-05T00:00:00.000Z"
    });
    expect(mapped.homeStats).toMatchObject({
      cornerKicks: 4,
      expectedGoals: "1.4",
      passesAccuracyPercentage: 84,
      possession: "55%",
      redCards: 0,
      shotsOnGoal: 6,
      shotsOffGoal: 4,
      shotsTotal: 12,
      yellowCards: 1
    });
    expect(mapped.topPlayers?.[0]).toMatchObject({
      goals: 2,
      name: "Home Star",
      rating: 8.4,
      teamName: "Team"
    });
    expect(mapped.events?.[0]).toMatchObject({
      assistName: "도움",
      detail: "Normal Goal",
      elapsed: 12,
      playerName: "득점자",
      teamName: "홈",
      type: "Goal"
    });
    expect(mapped.lineup?.home).toMatchObject({
      formation: "4-3-3",
      players: [
        {
          matchPlayerUid: "lineup-1",
          name: "골키퍼",
          number: 1,
          position: "G",
          shotsOn: 2,
          substitute: false
        }
      ],
      teamName: "홈"
    });
  });
});

function createTeamStatistics(
  playerUid: string,
  playerName: string,
  rating: string,
  goals: number
): NonNullable<FixtureStatisticsResponse["home"]> {
  return {
    playerStatistics: [
      {
        player: {
          matchPlayerUid: playerUid,
          name: playerName
        },
        statistics: {
          assists: 0,
          captain: false,
          dribblesAttempts: 0,
          dribblesSuccess: 0,
          duelsTotal: 4,
          duelsWon: 2,
          foulsCommitted: 1,
          foulsDrawn: 1,
          goals,
          goalsConceded: 0,
          interceptions: 1,
          minutesPlayed: 90,
          passesAccuracy: 84,
          passesKey: 2,
          passesTotal: 20,
          penaltiesMissed: 0,
          penaltiesSaved: 0,
          penaltiesScored: 0,
          rating,
          redCards: 0,
          saves: 0,
          shotsOn: 2,
          shotsTotal: 3,
          substitute: false,
          tacklesTotal: 2,
          yellowCards: 1
        }
      }
    ],
    team: {
      teamUid: "team",
      name: "Team"
    },
    teamStatistics: {
      ballPossession: 55,
      blockedShots: 2,
      cornerKicks: 4,
      fouls: 8,
      goalkeeperSaves: 3,
      goalsPrevented: 0,
      offsides: 1,
      passesAccurate: 320,
      passesAccuracyPercentage: 84,
      redCards: 0,
      shotsOnGoal: 6,
      shotsOffGoal: 4,
      shotsInsideBox: 8,
      shotsOutsideBox: 4,
      totalPasses: 380,
      totalShots: 12,
      yellowCards: 1,
      xg: [{ elapsed: 90, xg: "1.4" }]
    }
  };
}
