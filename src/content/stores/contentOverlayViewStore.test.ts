import { beforeEach, describe, expect, it } from "vitest";
import { useContentOverlayViewStore } from "./contentOverlayViewStore";

describe("content overlay view state", () => {
  beforeEach(() => {
    useContentOverlayViewStore.setState({ drawerSide: undefined, overlayCollapsed: true, selectedPlayerUid: undefined, viewMode: "compact" });
  });

  it("keeps collapse, drawer, player selection, and view-mode interactions available for PageSession wiring", () => {
    useContentOverlayViewStore.getState().setOverlayCollapsed(false);
    useContentOverlayViewStore.getState().openLeftDrawer();
    expect(useContentOverlayViewStore.getState()).toMatchObject({ drawerSide: "left", overlayCollapsed: false, viewMode: "drawer" });
    useContentOverlayViewStore.getState().selectPlayer("player-1");
    expect(useContentOverlayViewStore.getState()).toMatchObject({ drawerSide: "right", selectedPlayerUid: "player-1", viewMode: "drawer" });
    useContentOverlayViewStore.getState().closeDrawer();
    expect(useContentOverlayViewStore.getState()).toMatchObject({ drawerSide: undefined, selectedPlayerUid: undefined, viewMode: "compact" });
  });
});
