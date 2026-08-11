import { create } from "zustand";
import {
  requestAvailableLeagues,
  requestFixtures,
  type AvailableLeagueDto,
  type FixtureDto
} from "@/shared/footballayApiProtocol";

export type LoadStatus = "idle" | "loading" | "ready" | "error";

type MatchPickerState = {
  leagues: AvailableLeagueDto[];
  leagueStatus: LoadStatus;
  leagueError?: string;
  fixtures: FixtureDto[];
  fixtureStatus: LoadStatus;
  fixtureError?: string;
  selectedLeagueUid?: string;
  selectedFixtureUid?: string;
  loadAvailableLeagues: () => Promise<void>;
  selectLeagueAndLoadFixtures: (leagueUid: string) => Promise<void>;
  selectFixture: (fixtureUid: string) => void;
};

let latestFixtureRequestId = 0;

export const useMatchPickerStore = create<MatchPickerState>((set) => ({
  leagues: [],
  leagueStatus: "idle",
  fixtures: [],
  fixtureStatus: "idle",
  loadAvailableLeagues: async () => {
    set({ leagueStatus: "loading", leagueError: undefined });

    try {
      const response = await requestAvailableLeagues();
      if (!response.ok) {
        set({ leagueStatus: "error", leagueError: response.error });
        return;
      }

      set({ leagues: response.data, leagueStatus: "ready", leagueError: undefined });
    } catch (error) {
      set({
        leagueStatus: "error",
        leagueError: error instanceof Error ? error.message : "Unable to load available leagues"
      });
    }
  },
  selectLeagueAndLoadFixtures: async (leagueUid) => {
    const requestId = ++latestFixtureRequestId;
    const now = new Date();
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")]
      .join("-");
    set({
      selectedLeagueUid: leagueUid,
      selectedFixtureUid: undefined,
      fixtures: [],
      fixtureStatus: "loading",
      fixtureError: undefined
    });

    try {
      const response = await requestFixtures({
        leagueUid,
        date,
        mode: "nearest",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
      });
      if (requestId !== latestFixtureRequestId) return;

      if (!response.ok) {
        set({ fixtureStatus: "error", fixtureError: response.error });
        return;
      }

      set({ fixtures: response.data, fixtureStatus: "ready", fixtureError: undefined });
    } catch (error) {
      if (requestId !== latestFixtureRequestId) return;

      set({
        fixtureStatus: "error",
        fixtureError: error instanceof Error ? error.message : "Unable to load fixtures"
      });
    }
  },
  selectFixture: (selectedFixtureUid) => set({ selectedFixtureUid })
}));
