// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useContentOverlayShortcuts } from "./useContentOverlayShortcuts";
import { useContentOverlayViewStore } from "@/content/stores/contentOverlayViewStore";

function ShortcutHost({ enabled }: { enabled: boolean }) {
  useContentOverlayShortcuts(enabled);
  return <input aria-label="Search" />;
}

describe("useContentOverlayShortcuts", () => {
  beforeEach(() => {
    useContentOverlayViewStore.setState({
      drawerSide: undefined,
      selectedPlayerUid: undefined,
      viewMode: "compact"
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("opens left and right drawers with keyboard shortcuts", () => {
    render(<ShortcutHost enabled />);

    fireEvent.keyDown(window, { altKey: true, key: "[" });
    expect(useContentOverlayViewStore.getState()).toMatchObject({
      drawerSide: "left",
      viewMode: "drawer"
    });

    fireEvent.keyDown(window, { altKey: true, key: "]" });
    expect(useContentOverlayViewStore.getState()).toMatchObject({
      drawerSide: "right",
      viewMode: "drawer"
    });

    fireEvent.keyDown(window, { key: "Escape" });
    expect(useContentOverlayViewStore.getState()).toMatchObject({
      drawerSide: undefined,
      viewMode: "compact"
    });
  });

  it("ignores shortcuts when disabled or focused on editable targets", () => {
    render(<ShortcutHost enabled={false} />);

    fireEvent.keyDown(window, { altKey: true, key: "[" });
    expect(useContentOverlayViewStore.getState().drawerSide).toBeUndefined();

    cleanup();
    render(<ShortcutHost enabled />);

    screen.getByRole("textbox", { name: "Search" }).focus();
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Search" }), { altKey: true, key: "]" });

    expect(useContentOverlayViewStore.getState().drawerSide).toBeUndefined();
  });

  it("clears selected player before closing the drawer with Escape", () => {
    render(<ShortcutHost enabled />);
    useContentOverlayViewStore.setState({
      drawerSide: "right",
      selectedPlayerUid: "player-1",
      viewMode: "drawer"
    });

    fireEvent.keyDown(window, { key: "Escape" });

    expect(useContentOverlayViewStore.getState()).toMatchObject({
      drawerSide: "right",
      selectedPlayerUid: undefined,
      viewMode: "drawer"
    });

    fireEvent.keyDown(window, { key: "Escape" });

    expect(useContentOverlayViewStore.getState()).toMatchObject({
      drawerSide: undefined,
      viewMode: "compact"
    });
  });
});
