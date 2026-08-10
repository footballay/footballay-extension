import { create } from "zustand";
import {
  requestAvailableLeagues,
  type AvailableLeagueDto
} from "@/shared/footballayApiProtocol";

export type LeagueLoadStatus = "idle" | "loading" | "ready" | "error";

type LeagueState = {
  leagues: AvailableLeagueDto[];
  status: LeagueLoadStatus;
  error?: string;
  selectedLeagueUid?: string;
  loadAvailableLeagues: () => Promise<void>;
  selectLeague: (leagueUid: string) => void;
};

export const useLeagueStore = create<LeagueState>((set) => ({
  leagues: [],
  status: "idle",
  loadAvailableLeagues: async () => {
    set({ status: "loading", error: undefined });

    try {
      const response = await requestAvailableLeagues();
      if (!response.ok) {
        set({ status: "error", error: response.error });
        return;
      }
      set({ leagues: response.data, status: "ready", error: undefined });
    } catch (error) {
      set({
        status: "error",
        error: error instanceof Error ? error.message : "Unable to load available leagues"
      });
    }
  },
  selectLeague: (selectedLeagueUid) => set({ selectedLeagueUid })
}));
