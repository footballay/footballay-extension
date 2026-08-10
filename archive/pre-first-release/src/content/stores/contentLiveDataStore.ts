import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import { create } from "zustand";

type ContentLiveDataState = {
  data: LiveMatchOverlayData | null;
};

type ContentLiveDataActions = {
  clearData: () => void;
  setData: (data: LiveMatchOverlayData | null) => void;
};

type ContentLiveDataStore = ContentLiveDataState & ContentLiveDataActions;

export const useContentLiveDataStore = create<ContentLiveDataStore>((set) => ({
  data: null,

  clearData() {
    set({ data: null });
  },

  setData(data) {
    set({ data });
  }
}));
