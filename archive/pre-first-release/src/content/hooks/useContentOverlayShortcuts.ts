import { useEffect } from "react";
import { useContentOverlayViewStore } from "@/content/stores/contentOverlayViewStore";

export function useContentOverlayShortcuts(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.altKey && event.key === "[") {
        event.preventDefault();
        useContentOverlayViewStore.getState().openLeftDrawer();
        return;
      }

      if (event.altKey && event.key === "]") {
        event.preventDefault();
        useContentOverlayViewStore.getState().openRightDrawer();
        return;
      }

      if (event.key === "Escape") {
        const viewStore = useContentOverlayViewStore.getState();
        if (viewStore.selectedPlayerUid) {
          viewStore.clearSelectedPlayer();
          return;
        }

        viewStore.closeDrawer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}
