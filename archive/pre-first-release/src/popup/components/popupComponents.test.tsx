// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { FixtureSummary } from "@/domain/live-match/types";
import { FixtureDateNavigator } from "./FixtureDateNavigator";
import { FixtureList } from "./FixtureList";
import { LeaguePicker } from "./LeaguePicker";
import { OverlaySettingsSection } from "./OverlaySettingsSection";

const fixtures: FixtureSummary[] = [
  {
    available: true, awayScore: 1, awayTeamName: "Manchester City", elapsed: 90,
    homeScore: 1, homeTeamName: "Bournemouth", kickoff: "2026-05-20T12:00:00.000Z",
    round: "Regular Season - 37", statusLong: "Match Finished", statusShort: "FT", uid: "fixture-1"
  },
  {
    available: true, awayScore: null, awayTeamName: "Tottenham", elapsed: null,
    homeScore: null, homeTeamName: "Chelsea", kickoff: "2026-05-21T12:00:00.000Z",
    round: "Regular Season - 37", statusLong: "Not Started", statusShort: "NS", uid: "fixture-2"
  }
];

beforeAll(() => {
  class ResizeObserverMock { observe() {} disconnect() {} unobserve() {} }
  window.ResizeObserver = ResizeObserverMock;
});

afterEach(cleanup);

describe("Match Picker presentation components", () => {
  it("exposes selected league state and forwards a new league selection", async () => {
    const user = userEvent.setup();
    const onSelectLeague = vi.fn();
    render(
      <LeaguePicker
        leagues={[{ name: "Premier League", uid: "league-1" }, { name: "World Cup", uid: "league-2" }]}
        selectedLeagueUid="league-1"
        onSelectLeague={onSelectLeague}
      />
    );
    expect(screen.getByRole("button", { name: "Premier League" }).getAttribute("aria-pressed")).toBe("true");
    await user.click(screen.getByRole("button", { name: "World Cup" }));
    expect(onSelectLeague).toHaveBeenCalledWith("league-2");
  });

  it("renders fixture selection affordances and forwards both selection actions", async () => {
    const user = userEvent.setup();
    const onSelectFixture = vi.fn();
    render(<FixtureList fixtures={fixtures} loadingText={null} selectedFixtureUid="fixture-1" selectedLeagueUid="league-1" onSelectFixture={onSelectFixture} />);
    expect(screen.getByRole("button", { name: "Selected fixture" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Select fixture" }));
    await user.click(screen.getByRole("button", { name: "Selected fixture" }));
    expect(onSelectFixture).toHaveBeenNthCalledWith(1, "fixture-2");
    expect(onSelectFixture).toHaveBeenNthCalledWith(2, "fixture-1");
  });

  it("renders loading and unselected fixture states accessibly", () => {
    const { rerender } = render(<FixtureList fixtures={[]} loadingText="Loading fixtures" selectedLeagueUid="league-1" onSelectFixture={vi.fn()} />);
    expect(screen.getByText("Loading fixtures")).toBeTruthy();
    rerender(<FixtureList fixtures={fixtures} loadingText={null} selectedFixtureUid="outside" selectedLeagueUid="league-1" onSelectFixture={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Selected fixture" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "Select fixture" })).toHaveLength(2);
  });

  it("forwards date navigation and exposes the return-to-selected-date action", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const onReturnToSelectedFixtureDate = vi.fn();
    render(<FixtureDateNavigator disabled={false} fixtureDate="2026-05-20" selectedFixtureDate="2026-05-18" onNavigate={onNavigate} onReturnToSelectedFixtureDate={onReturnToSelectedFixtureDate} onSelectDate={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Previous fixture date" }));
    await user.click(screen.getByRole("button", { name: "Next fixture date" }));
    expect(onNavigate).toHaveBeenNthCalledWith(1, "previous");
    expect(onNavigate).toHaveBeenNthCalledWith(2, "next");
    await user.click(screen.getByRole("button", { name: /05\.20/ }));
    await user.click(screen.getByRole("button", { name: "Return to selected fixture date" }));
    expect(onReturnToSelectedFixtureDate).toHaveBeenCalledTimes(1);
  });

  it("disables every date control while the fixture query is loading", () => {
    render(<FixtureDateNavigator disabled fixtureDate="2026-05-20" selectedFixtureDate="2026-05-18" onNavigate={vi.fn()} onReturnToSelectedFixtureDate={vi.fn()} onSelectDate={vi.fn()} />);
    expect((screen.getByRole("button", { name: "Previous fixture date" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: /05\.20/ }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Next fixture date" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("forwards global overlay position changes and keeps contact links accessible", async () => {
    const user = userEvent.setup();
    const onChangeSettings = vi.fn();
    render(<OverlaySettingsSection extensionEnabled overlayPosition="bottom-right" onChangeSettings={onChangeSettings} />);
    await user.selectOptions(screen.getByRole("combobox"), "top-left");
    expect(onChangeSettings).toHaveBeenCalledWith({ overlayPosition: "top-left" });
    expect(screen.getByRole("link", { name: "GitHub" }).getAttribute("href")).toBe("https://github.com/PhysicksKim");
  });
});
