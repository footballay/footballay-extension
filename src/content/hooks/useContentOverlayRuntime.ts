import { useEffect } from "react";
import { loadInitialContentOverlayState } from "@/content/actions/contentOverlayActions";

export function useContentOverlayRuntime(): void {
  useEffect(() => {
    void loadInitialContentOverlayState();
  }, []);
}
