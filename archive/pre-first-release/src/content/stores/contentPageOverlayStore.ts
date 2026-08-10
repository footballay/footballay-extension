import { isSupportedStreamingUrl } from "@/shared/url";
import { create } from "zustand";

type ContentPageOverlayState = {
  isSupportedPage: boolean;
  pageUrl: string;
  siteOverlayVisible: boolean;
};

type ContentPageOverlayActions = {
  setSiteOverlayVisible: (siteOverlayVisible: boolean) => void;
};

export type ContentPageOverlayStore = ContentPageOverlayState & ContentPageOverlayActions;

const initialPageUrl = typeof window === "undefined" ? "" : window.location.href;

export const useContentPageOverlayStore = create<ContentPageOverlayStore>((set) => ({
  isSupportedPage: initialPageUrl ? isSupportedStreamingUrl(initialPageUrl) : false,
  pageUrl: initialPageUrl,
  siteOverlayVisible: initialPageUrl ? isSupportedStreamingUrl(initialPageUrl) : false,

  setSiteOverlayVisible(siteOverlayVisible) {
    set({ siteOverlayVisible });
  }
}));
