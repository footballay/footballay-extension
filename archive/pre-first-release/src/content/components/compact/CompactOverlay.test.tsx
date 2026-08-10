// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LiveMatchOverlayData } from "@/domain/live-match/types";
import { defaultSettings } from "@/shared/constants";
import { CompactOverlay } from "./CompactOverlay";

const matchData: LiveMatchOverlayData = {
  awayScore: 1,
  awayStats: {
    cornerKicks: 3,
    expectedGoals: "0.8",
    passesAccuracyPercentage: 81,
    possession: "42%",
    shotsOnGoal: 2,
    shotsTotal: 7,
    yellowCards: 1
  },
  awayTeamName: "Away",
  fixtureUid: "fixture-1",
  homeScore: 2,
  homeStats: {
    cornerKicks: 6,
    expectedGoals: "1.6",
    passesAccuracyPercentage: 88,
    possession: "58%",
    shotsOnGoal: 5,
    shotsTotal: 11,
    yellowCards: 2
  },
  homeTeamName: "Home",
  updatedAt: "2026-06-05T00:00:00.000Z"
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("CompactOverlay", () => {
  it("renders a minimal one-line ambient stat ticker", () => {
    const { container } = render(<CompactOverlay data={matchData} onCollapse={vi.fn()} />);

    expect(screen.getByLabelText("Footballay live stat ticker")).toBeTruthy();
    expect(container.querySelector(".footballay-ambient__icon")).toBeTruthy();
    expect(screen.getByText("xG 1.6 - 0.8")).toBeTruthy();
    expect(screen.queryByText("Expand")).toBeNull();
  });

  it("rotates through available ambient stats", () => {
    vi.useFakeTimers();
    render(<CompactOverlay data={matchData} onCollapse={vi.fn()} />);

    act(() => {
      vi.advanceTimersByTime(7000);
    });

    expect(screen.getByText("SOT 5 - 2")).toBeTruthy();
  });

  it("uses configured ticker stat order and interval", () => {
    vi.useFakeTimers();
    render(
      <CompactOverlay
        data={matchData}
        settings={{
          ...defaultSettings,
          overlayTickerIntervalMs: 1200,
          overlayTickerStatsMode: "custom",
          overlayTickerCustomStatKeys: ["shotsTotal", "possession"]
        }}
        onCollapse={vi.fn()}
      />
    );

    expect(screen.getByText("Shots 11 - 7")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(screen.getByText("Possession 58% - 42%")).toBeTruthy();
  });

  it("applies configured ticker scale", () => {
    render(
      <CompactOverlay
        data={matchData}
        settings={{
          ...defaultSettings,
          overlayTickerScale: 1.5
        }}
        onCollapse={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Footballay live stat ticker").style.getPropertyValue("--footballay-ambient-font-size")).toBe("24px");
  });

  it("moves between ambient stats with manual controls", async () => {
    const user = userEvent.setup();
    render(<CompactOverlay data={matchData} onCollapse={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Show next stat" }));
    expect(screen.getByText("SOT 5 - 2")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Show previous stat" }));
    expect(screen.getByText("xG 1.6 - 0.8")).toBeTruthy();
  });

  it("shows a fallback line without live data", () => {
    render(<CompactOverlay data={null} onCollapse={vi.fn()} />);

    expect(screen.getByText("Waiting for live data")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Show previous stat" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Show next stat" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("forwards the hide action", async () => {
    const user = userEvent.setup();
    const onCollapse = vi.fn();
    render(<CompactOverlay data={matchData} onCollapse={onCollapse} />);

    await user.click(screen.getByRole("button", { name: "Hide Footballay overlay" }));

    expect(onCollapse).toHaveBeenCalledTimes(1);
  });
});
