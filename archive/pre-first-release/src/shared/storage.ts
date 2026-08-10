import { storage } from "wxt/utils/storage";
import type { ExtensionSettings } from "@/shared/overlay/types";
import { normalizeExtensionSettings } from "@/shared/overlay/settings";
import {
  defaultPageSessionSnapshot,
  getPageSessionKey,
  type PageIdentity,
  type PageSessionSnapshot
} from "@/shared/page-session";

const SETTINGS_KEY = "local:footballay-settings";
const PAGE_SESSIONS_KEY = "local:footballay-page-sessions";

type StoredPageSessions = Record<string, Partial<PageSessionSnapshot>>;

export async function readSettings(): Promise<ExtensionSettings> {
  const stored = await storage.getItem<Partial<ExtensionSettings>>(SETTINGS_KEY);
  const settings = normalizeExtensionSettings(stored);
  if (JSON.stringify(stored ?? {}) !== JSON.stringify(settings)) {
    await storage.setItem(SETTINGS_KEY, settings);
  }
  return settings;
}

export async function writeSettings(patch: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
  const settings = normalizeExtensionSettings({ ...(await readSettings()), ...patch });
  await storage.setItem(SETTINGS_KEY, settings);
  return settings;
}

export async function readPageSession(identity: PageIdentity): Promise<PageSessionSnapshot> {
  const sessions = await readPageSessions();
  return normalizePageSession(sessions[getPageSessionKey(identity)]);
}

export async function writePageSession(
  identity: PageIdentity,
  patch: Partial<PageSessionSnapshot>
): Promise<PageSessionSnapshot> {
  const sessions = await readPageSessions();
  const key = getPageSessionKey(identity);
  const next = normalizePageSession({ ...sessions[key], ...patch });
  await storage.setItem(PAGE_SESSIONS_KEY, { ...sessions, [key]: next });
  return next;
}

async function readPageSessions(): Promise<StoredPageSessions> {
  const stored = await storage.getItem<unknown>(PAGE_SESSIONS_KEY);
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
    return {};
  }
  return stored as StoredPageSessions;
}

function normalizePageSession(raw: Partial<PageSessionSnapshot> | undefined): PageSessionSnapshot {
  const value = raw ?? {};
  return {
    fixtureLookupMode:
      value.fixtureLookupMode === "previous" || value.fixtureLookupMode === "exact" || value.fixtureLookupMode === "nearest"
        ? value.fixtureLookupMode
        : defaultPageSessionSnapshot.fixtureLookupMode,
    overlayCollapsed: typeof value.overlayCollapsed === "boolean" ? value.overlayCollapsed : defaultPageSessionSnapshot.overlayCollapsed,
    overlayVisible: typeof value.overlayVisible === "boolean" ? value.overlayVisible : defaultPageSessionSnapshot.overlayVisible,
    ...optionalStringFields(value)
  };
}

function optionalStringFields(value: Partial<PageSessionSnapshot>): Partial<PageSessionSnapshot> {
  const fields = [
    "fixtureDate",
    "selectedDrawerSide",
    "selectedFixtureDate",
    "selectedFixtureUid",
    "selectedLeagueUid",
    "selectedPlayerUid"
  ] as const;
  return Object.fromEntries(
    fields.flatMap((field) => {
      const item = value[field];
      if (typeof item !== "string" || item.length === 0) {
        return [];
      }
      if (field === "selectedDrawerSide" && item !== "left" && item !== "right") {
        return [];
      }
      return [[field, item]];
    })
  ) as Partial<PageSessionSnapshot>;
}
