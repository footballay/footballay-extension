import { useEffect, useMemo } from "react";
import "./styles/base.css";
import { CompactOverlay } from "./components/compact/CompactOverlay";
import { LeftMatchDrawer } from "./components/leftDrawer/LeftMatchDrawer";
import { OverlayButton } from "./components/overlayControls/OverlayButton";
import { SideDrawerHandle } from "./components/overlayControls/SideDrawerHandle";
import { RightLineupDrawer } from "./components/rightDrawer/RightLineupDrawer";
import { useContentOverlayRuntime } from "./hooks/useContentOverlayRuntime";
import { useContentOverlayShortcuts } from "./hooks/useContentOverlayShortcuts";
import { selectShouldRenderOverlayControl } from "@/content/selectors/contentOverlaySelectors";
import { useContentLiveDataStore } from "@/content/stores/contentLiveDataStore";
import { useContentOverlayViewStore } from "@/content/stores/contentOverlayViewStore";
import { useContentPageOverlayStore } from "@/content/stores/contentPageOverlayStore";
import { useContentSettingsStore } from "@/content/stores/contentSettingsStore";
import { getOverlayPositionClass } from "@/shared/overlay/position";

export function ContentOverlayApp() {
  const data = useContentLiveDataStore((state) => state.data);
  const settings = useContentSettingsStore((state) => state.settings);
  const isSupportedPage = useContentPageOverlayStore((state) => state.isSupportedPage);
  const pageUrl = useContentPageOverlayStore((state) => state.pageUrl);
  const siteOverlayVisible = useContentPageOverlayStore((state) => state.siteOverlayVisible);
  const drawerSide = useContentOverlayViewStore((state) => state.drawerSide);
  const overlayCollapsed = useContentOverlayViewStore((state) => state.overlayCollapsed);
  const selectedPlayerUid = useContentOverlayViewStore((state) => state.selectedPlayerUid);
  const clearSelectedPlayer = useContentOverlayViewStore((state) => state.clearSelectedPlayer);
  const closeDrawer = useContentOverlayViewStore((state) => state.closeDrawer);
  const openLeftDrawer = useContentOverlayViewStore((state) => state.openLeftDrawer);
  const openRightDrawer = useContentOverlayViewStore((state) => state.openRightDrawer);
  const selectPlayer = useContentOverlayViewStore((state) => state.selectPlayer);
  const setOverlayCollapsed = useContentOverlayViewStore((state) => state.setOverlayCollapsed);
  const shouldRenderControl = selectShouldRenderOverlayControl({
    isSupportedPage,
    pageUrl,
    siteOverlayVisible
  });

  useContentOverlayRuntime();
  useContentOverlayShortcuts(shouldRenderControl && settings.extensionEnabled && !overlayCollapsed);

  const shellClassName = useMemo(
    () => `footballay-overlay-shell ${getOverlayPositionClass(settings.overlayPosition)}`,
    [settings.overlayPosition]
  );

  if (!shouldRenderControl || !settings.extensionEnabled) {
    return null;
  }

  const shouldRenderDrawerHandles = settings.extensionEnabled && !overlayCollapsed;

  return (
    <>
      <div className={shellClassName}>
        {overlayCollapsed ? (
          <OverlayButton onClick={() => setOverlayCollapsed(false)} />
        ) : (
          <CompactOverlay
            data={data}
            settings={settings}
            onCollapse={() => setOverlayCollapsed(true)}
          />
        )}
      </div>
      {shouldRenderDrawerHandles ? (
        <>
          <SideDrawerHandle
            active={drawerSide === "left"}
            side="left"
            onClick={drawerSide === "left" ? closeDrawer : openLeftDrawer}
          />
          <SideDrawerHandle
            active={drawerSide === "right"}
            side="right"
            onClick={drawerSide === "right" ? closeDrawer : openRightDrawer}
          />
        </>
      ) : null}
      {drawerSide === "right" && shouldRenderDrawerHandles ? (
        <RightLineupDrawer
          data={data}
          selectedPlayerUid={selectedPlayerUid}
          onClearSelectedPlayer={clearSelectedPlayer}
          onSelectPlayer={selectPlayer}
        />
      ) : null}
      {drawerSide === "left" && shouldRenderDrawerHandles ? (
        <LeftMatchDrawer data={data} />
      ) : null}
    </>
  );
}
