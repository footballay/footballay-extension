import { beforeEach, describe, expect, it, vi } from "vitest";
import { storage } from "wxt/utils/storage";
import { defaultSettings } from "@/shared/constants";
import type { PageIdentity } from "@/shared/page-session";
import { readPageSession, readSettings, writePageSession } from "./storage";

const { storageItems } = vi.hoisted(() => ({ storageItems: new Map<string, unknown>() }));

vi.mock("wxt/utils/storage", () => ({
  storage: {
    getItem: vi.fn(async (key: string) => storageItems.get(key)),
    setItem: vi.fn(async (key: string, value: unknown) => storageItems.set(key, value))
  }
}));

const coupang: PageIdentity = { contentId: "/live/a", site: "coupang-play" };
const spotv: PageIdentity = { contentId: "/live/a", site: "spotv-now" };

describe("settings and page session storage", () => {
  beforeEach(() => {
    storageItems.clear();
    vi.mocked(storage.setItem).mockClear();
  });

  it("keeps fixture and UI recovery state out of global settings", async () => {
    storageItems.set("local:footballay-settings", { selectedFixtureUid: "legacy-fixture" });
    await expect(readSettings()).resolves.toEqual(defaultSettings);
  });

  it("stores page sessions independently by PageIdentity", async () => {
    await writePageSession(coupang, { overlayVisible: false, selectedFixtureUid: "fixture-a" });
    await writePageSession(spotv, { selectedFixtureUid: "fixture-b" });

    await expect(readPageSession(coupang)).resolves.toMatchObject({
      overlayVisible: false,
      selectedFixtureUid: "fixture-a"
    });
    await expect(readPageSession(spotv)).resolves.toMatchObject({
      overlayVisible: true,
      selectedFixtureUid: "fixture-b"
    });
  });

  it("does not persist browser document visibility", async () => {
    await writePageSession(coupang, { overlayVisible: false } as never);
    expect(storageItems.get("local:footballay-page-sessions")).toEqual({
      "coupang-play:/live/a": expect.objectContaining({ overlayVisible: false })
    });
  });
});
