import { create } from 'zustand';
import {
  requestAvailableLeagues,
  requestFixtures,
  type AvailableLeagueDto,
  type FixtureDto,
  type GetFixturesPayload,
} from '@/shared/footballayApiProtocol';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

type MatchPickerState = {
  leagues: AvailableLeagueDto[];
  leagueStatus: LoadStatus;
  leagueError?: string;
  fixtures: FixtureDto[];
  fixtureStatus: LoadStatus;
  fixtureError?: string;
  selectedLeagueUid?: string;
  selectedDate?: string;
  selectedFixtureUid?: string;
  loadAvailableLeagues: () => Promise<void>;
  selectLeagueAndLoadFixtures: (leagueUid: string) => Promise<void>;
  navigateFixtureDate: (direction: 'previous' | 'next') => Promise<void>;
  selectDateAndLoadFixtures: (date: string) => Promise<void>;
  selectFixture: (fixtureUid: string) => void;
};

let latestFixtureRequestId = 0;

function toDateInputValue(date: Date): string {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

export const useMatchPickerStore = create<MatchPickerState>((set, get) => {
  async function loadFixtures(
    leagueUid: string,
    date: string,
    mode: GetFixturesPayload['mode'],
  ): Promise<void> {
    const requestId = ++latestFixtureRequestId;
    set({
      selectedDate: date,
      selectedFixtureUid: undefined,
      fixtures: [],
      fixtureStatus: 'loading',
      fixtureError: undefined,
    });

    try {
      const response = await requestFixtures({
        leagueUid,
        date,
        mode,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      });
      if (requestId !== latestFixtureRequestId) return;

      if (!response.ok) {
        set({ fixtureStatus: 'error', fixtureError: response.error });
        return;
      }

      const kickoff = response.data.find((fixture) => fixture.kickoff)?.kickoff;
      const resolvedDate =
        mode === 'exact' || !kickoff
          ? date
          : toDateInputValue(new Date(kickoff));
      set({
        fixtures: response.data,
        selectedDate: resolvedDate,
        fixtureStatus: 'ready',
        fixtureError: undefined,
      });
    } catch (error) {
      if (requestId !== latestFixtureRequestId) return;

      set({
        fixtureStatus: 'error',
        fixtureError:
          error instanceof Error ? error.message : 'Unable to load fixtures',
      });
    }
  }

  return {
    leagues: [],
    leagueStatus: 'idle',
    fixtures: [],
    fixtureStatus: 'idle',
    loadAvailableLeagues: async () => {
      set({ leagueStatus: 'loading', leagueError: undefined });

      try {
        const response = await requestAvailableLeagues();
        if (!response.ok) {
          set({ leagueStatus: 'error', leagueError: response.error });
          return;
        }

        set({
          leagues: response.data,
          leagueStatus: 'ready',
          leagueError: undefined,
        });
      } catch (error) {
        set({
          leagueStatus: 'error',
          leagueError:
            error instanceof Error
              ? error.message
              : 'Unable to load available leagues',
        });
      }
    },
    selectLeagueAndLoadFixtures: async (leagueUid) => {
      set({
        selectedLeagueUid: leagueUid,
        selectedFixtureUid: undefined,
      });
      await loadFixtures(leagueUid, toDateInputValue(new Date()), 'nearest');
    },
    navigateFixtureDate: async (direction) => {
      const { selectedDate, selectedLeagueUid } = get();
      if (!selectedLeagueUid || !selectedDate) return;

      const nextDate = new Date(`${selectedDate}T00:00:00`);
      nextDate.setDate(
        nextDate.getDate() + (direction === 'previous' ? -1 : 1),
      );
      await loadFixtures(
        selectedLeagueUid,
        toDateInputValue(nextDate),
        direction === 'previous' ? 'previous' : 'nearest',
      );
    },
    selectDateAndLoadFixtures: async (date) => {
      const { selectedLeagueUid } = get();
      if (!selectedLeagueUid) return;

      await loadFixtures(selectedLeagueUid, date, 'exact');
    },
    selectFixture: (selectedFixtureUid) => set({ selectedFixtureUid }),
  };
});
