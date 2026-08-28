import { create } from 'zustand';
import {
  requestAvailableLeagues,
  requestFixtureDates,
  requestFixtures,
} from '@/shared/api/client';
import type { AvailableLeagueDto, FixtureDto } from '@/shared/api/dto';
import type { GetFixturesPayload } from '@/shared/api/protocol';
import {
  addDateDays,
  calendarRange,
  instantToDate,
  todayInTimezone,
} from '@/content/utils/date';
import { useSettingsStore } from '@/content/stores/settingsStore';
import {
  resolveTimezone,
  toLocaleOverride,
} from '@/shared/settings/resolution';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

type MatchPickerState = {
  leagues: AvailableLeagueDto[];
  leagueStatus: LoadStatus;
  leagueError?: string;
  fixtures: FixtureDto[];
  fixtureDates: string[];
  fixtureStatus: LoadStatus;
  fixtureError?: string;
  selectedLeagueUid?: string;
  selectedDate?: string;
  selectedFixtureUid?: string;
  loadAvailableLeagues: () => Promise<void>;
  selectLeagueAndLoadFixtures: (leagueUid: string) => Promise<void>;
  loadFixtureDates: (date: string) => Promise<void>;
  navigateFixtureDate: (direction: 'previous' | 'next') => Promise<void>;
  selectDateAndLoadFixtures: (date: string) => Promise<void>;
  reloadFixturesForLocale: () => Promise<void>;
  reloadFixturesForTimezone: () => Promise<void>;
  selectFixture: (fixtureUid: string) => void;
};

let latestFixtureRequestId = 0;
let latestFixtureDatesRequestId = 0;
let latestLeagueRequestId = 0;

export const useMatchPickerStore = create<MatchPickerState>((set, get) => {
  async function loadFixtures(
    leagueUid: string,
    date: string,
    mode: GetFixturesPayload['mode'],
    preserveSelectedFixture = false,
  ): Promise<void> {
    const requestId = ++latestFixtureRequestId;
    set({
      selectedDate: date,
      fixtures: [],
      fixtureStatus: 'loading',
      fixtureError: undefined,
    });

    try {
      const settings = useSettingsStore.getState().settings;
      const localeOverride = toLocaleOverride(settings.locale);
      const timezone = resolveTimezone(settings.timezone);
      const response = await requestFixtures({
        leagueUid,
        date,
        mode,
        timezone,
        ...(localeOverride && { localeOverride }),
      });
      if (requestId !== latestFixtureRequestId) return;

      if (!response.ok) {
        set({ fixtureStatus: 'error', fixtureError: response.error });
        return;
      }

      const kickoff = response.data.find((fixture) => fixture.kickoff)?.kickoff;
      const resolvedDate =
        mode === 'exact' || !kickoff ? date : instantToDate(kickoff, timezone);
      set({
        fixtures: response.data,
        selectedDate: resolvedDate,
        ...(preserveSelectedFixture &&
          get().selectedFixtureUid &&
          !response.data.some(
            (fixture) => fixture.uid === get().selectedFixtureUid,
          ) && { selectedFixtureUid: undefined }),
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
    fixtureDates: [],
    fixtureStatus: 'idle',
    loadAvailableLeagues: async () => {
      const requestId = ++latestLeagueRequestId;
      set({ leagueStatus: 'loading', leagueError: undefined });

      try {
        const localeOverride = toLocaleOverride(
          useSettingsStore.getState().settings.locale,
        );
        const response = await requestAvailableLeagues(
          localeOverride ? { localeOverride } : undefined,
        );
        if (requestId !== latestLeagueRequestId) return;
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
        if (requestId !== latestLeagueRequestId) return;
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
        fixtureDates: [],
      });
      const timezone = resolveTimezone(
        useSettingsStore.getState().settings.timezone,
      );
      await loadFixtures(leagueUid, todayInTimezone(timezone), 'nearest');
    },
    loadFixtureDates: async (date) => {
      const { selectedLeagueUid } = get();
      if (!selectedLeagueUid) return;

      const requestId = ++latestFixtureDatesRequestId;
      const { startDate, endDate } = calendarRange(date);
      set({ fixtureDates: [] });
      try {
        const settings = useSettingsStore.getState().settings;
        const response = await requestFixtureDates({
          leagueUid: selectedLeagueUid,
          startDate,
          endDate,
          timezone: resolveTimezone(settings.timezone),
        });
        if (requestId !== latestFixtureDatesRequestId) return;
        set({ fixtureDates: response.ok ? response.data : [] });
      } catch {
        if (requestId === latestFixtureDatesRequestId)
          set({ fixtureDates: [] });
      }
    },
    navigateFixtureDate: async (direction) => {
      const { selectedDate, selectedLeagueUid } = get();
      if (!selectedLeagueUid || !selectedDate) return;

      await loadFixtures(
        selectedLeagueUid,
        addDateDays(selectedDate, direction === 'previous' ? -1 : 1),
        direction === 'previous' ? 'previous' : 'nearest',
      );
    },
    selectDateAndLoadFixtures: async (date) => {
      const { selectedLeagueUid } = get();
      if (!selectedLeagueUid) return;

      await loadFixtures(selectedLeagueUid, date, 'exact');
    },
    reloadFixturesForLocale: async () => {
      const { selectedLeagueUid, selectedDate } = get();
      if (!selectedLeagueUid || !selectedDate) return;

      await loadFixtures(selectedLeagueUid, selectedDate, 'exact');
    },
    reloadFixturesForTimezone: async () => {
      const { selectedLeagueUid, selectedDate } = get();
      if (!selectedLeagueUid || !selectedDate) return;

      await loadFixtures(selectedLeagueUid, selectedDate, 'exact', true);
    },
    selectFixture: (selectedFixtureUid) => set({ selectedFixtureUid }),
  };
});
