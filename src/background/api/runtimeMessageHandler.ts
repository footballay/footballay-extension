import * as footballayApi from './footballayApi';
import {
  LOAD_RESTORE_STATE,
  SAVE_RESTORE_STATE,
  type RestoreState,
} from '@/shared/restore/protocol';
import {
  GET_AVAILABLE_LEAGUES,
  GET_FIXTURE_DATES,
  GET_FIXTURES,
  GET_FIXTURE_EVENTS,
  GET_FIXTURE_LINEUP,
  GET_FIXTURE_STATISTICS,
  GET_FIXTURE_STATUS,
  type GetFixturesPayload,
  type GetFixtureDatesPayload,
  type GetAvailableLeaguesPayload,
  type LocaleOverride,
  type FootballayApiResponse,
} from '@/shared/api/protocol';

export async function handleRuntimeMessage(
  message: unknown,
  sender?: chrome.runtime.MessageSender,
): Promise<FootballayApiResponse<unknown>> {
  const request = parseRequestEnvelope(message);
  if (!request) {
    return invalidRequest();
  }

  switch (request.type) {
    case LOAD_RESTORE_STATE:
      if (request.payload !== undefined) return invalidRestoreRequest();
      return loadRestoreState(sender);

    case SAVE_RESTORE_STATE: {
      const state = parseRestoreState(request.payload);
      if (!state) return invalidRestoreRequest();
      return saveRestoreState(sender, state);
    }

    case GET_AVAILABLE_LEAGUES:
      if (
        request.payload !== undefined &&
        !parseGetAvailableLeaguesPayload(request.payload)
      )
        return invalidRequest();

      try {
        return {
          ok: true,
          data: await footballayApi.getAvailableLeagues(
            parseGetAvailableLeaguesPayload(request.payload)?.localeOverride,
          ),
        };
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : 'Footballay API request failed',
        };
      }

    case GET_FIXTURES: {
      const payload = parseGetFixturesPayload(request.payload);
      if (!payload) return invalidRequest();

      try {
        return { ok: true, data: await footballayApi.getFixtures(payload) };
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : 'Footballay API request failed',
        };
      }
    }

    case GET_FIXTURE_DATES: {
      const payload = parseGetFixtureDatesPayload(request.payload);
      if (!payload) return invalidRequest();

      try {
        return { ok: true, data: await footballayApi.getFixtureDates(payload) };
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : 'Footballay API request failed',
        };
      }
    }

    case GET_FIXTURE_STATUS:
      return requestFixtureData(request.payload, (fixtureUid, etag) =>
        footballayApi.getFixtureStatus(fixtureUid, etag),
      );
    case GET_FIXTURE_LINEUP:
      return requestFixtureData(
        request.payload,
        (fixtureUid, etag, localeOverride) =>
          footballayApi.getFixtureLineup(fixtureUid, etag, localeOverride),
        true,
      );
    case GET_FIXTURE_EVENTS:
      return requestFixtureData(
        request.payload,
        (fixtureUid, etag, localeOverride) =>
          footballayApi.getFixtureEvents(fixtureUid, etag, localeOverride),
        true,
      );
    case GET_FIXTURE_STATISTICS:
      return requestFixtureData(
        request.payload,
        (fixtureUid, etag, localeOverride) =>
          footballayApi.getFixtureStatistics(fixtureUid, etag, localeOverride),
        true,
      );

    default:
      return invalidRequest();
  }
}

const RESTORE_LAST_SELECTION_KEY = 'footballay-restore-state';
const RESTORE_TAB_SELECTION_PREFIX = 'footballay-restore-tab:';
const RESTORE_TTL_MS = 4 * 60 * 60 * 1_000;

async function loadRestoreState(
  sender?: chrome.runtime.MessageSender,
): Promise<FootballayApiResponse<RestoreState | undefined>> {
  const tabId = restoreTabId(sender);
  if (tabId === undefined) return invalidRestoreRequest();

  const tabKey = restoreTabKey(tabId);
  const tabValues = await chrome.storage.session.get(tabKey);
  const tabState = parseRestoreState(tabValues[tabKey]);
  if (tabState && !isRestoreExpired(tabState)) {
    return { ok: true, data: tabState };
  }

  const localValues = await chrome.storage.local.get(
    RESTORE_LAST_SELECTION_KEY,
  );
  const localState = parseRestoreState(localValues[RESTORE_LAST_SELECTION_KEY]);
  if (!localState || isRestoreExpired(localState)) {
    return { ok: true, data: undefined };
  }

  await chrome.storage.session.set({ [tabKey]: localState });
  return { ok: true, data: localState };
}

async function saveRestoreState(
  sender: chrome.runtime.MessageSender | undefined,
  state: RestoreState,
): Promise<FootballayApiResponse<undefined>> {
  const tabId = restoreTabId(sender);
  if (tabId === undefined) return invalidRestoreRequest();

  await Promise.all([
    chrome.storage.local.set({ [RESTORE_LAST_SELECTION_KEY]: state }),
    chrome.storage.session.set({ [restoreTabKey(tabId)]: state }),
  ]);
  return { ok: true, data: undefined };
}

function restoreTabId(
  sender?: chrome.runtime.MessageSender,
): number | undefined {
  if (sender?.tab?.id === undefined || !sender.url) return undefined;

  try {
    const url = new URL(sender.url);
    return url.origin === 'https://www.coupangplay.com'
      ? sender.tab.id
      : undefined;
  } catch {
    return undefined;
  }
}

function restoreTabKey(tabId: number): string {
  return `${RESTORE_TAB_SELECTION_PREFIX}${tabId}`;
}

function isRestoreExpired(state: RestoreState): boolean {
  const age = Date.now() - state.updatedAt;
  return age < 0 || age > RESTORE_TTL_MS;
}

function parseRestoreState(value: unknown): RestoreState | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined;

  const state = value as Record<string, unknown>;
  return hasOnlyFields(state, [
    'leagueUid',
    'selectedDate',
    'fixtureUid',
    'updatedAt',
  ]) &&
    isNonEmptyString(state.leagueUid) &&
    isDateInputValue(state.selectedDate) &&
    isNonEmptyString(state.fixtureUid) &&
    typeof state.updatedAt === 'number' &&
    Number.isFinite(state.updatedAt) &&
    state.updatedAt >= 0
    ? {
        leagueUid: state.leagueUid,
        selectedDate: state.selectedDate,
        fixtureUid: state.fixtureUid,
        updatedAt: state.updatedAt,
      }
    : undefined;
}

async function requestFixtureData<T>(
  payload: unknown,
  request: (
    fixtureUid: string,
    etag?: string,
    localeOverride?: LocaleOverride,
  ) => Promise<T>,
  localized = false,
): Promise<FootballayApiResponse<T>> {
  const fixture = parseFixturePayload(payload, localized);
  if (!fixture) return invalidRequest();

  try {
    return {
      ok: true,
      data: await request(
        fixture.fixtureUid,
        fixture.etag,
        fixture.localeOverride,
      ),
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Footballay API request failed',
    };
  }
}

function parseFixturePayload(
  payload: unknown,
  localized: boolean,
):
  | { fixtureUid: string; etag?: string; localeOverride?: LocaleOverride }
  | undefined {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload))
    return undefined;
  const value = payload as Record<string, unknown>;
  return hasOnlyFields(value, [
    'fixtureUid',
    'etag',
    ...(localized ? ['localeOverride'] : []),
  ]) &&
    isNonEmptyString(value.fixtureUid) &&
    (value.etag === undefined || typeof value.etag === 'string') &&
    isLocaleOverride(value.localeOverride)
    ? {
        fixtureUid: value.fixtureUid,
        etag: value.etag,
        localeOverride: value.localeOverride,
      }
    : undefined;
}

function parseRequestEnvelope(
  value: unknown,
): { type: string; payload?: unknown } | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined;
  const request = value as Record<string, unknown>;
  if (typeof request.type !== 'string') return undefined;
  if (hasUnsupportedEnvelopeField(request)) return undefined;
  return { type: request.type, payload: request.payload };
}

function hasUnsupportedEnvelopeField(record: Record<string, unknown>): boolean {
  return !Object.keys(record).every(
    (key) => key === 'type' || key === 'payload',
  );
}

function parseGetFixturesPayload(
  payload: unknown,
): GetFixturesPayload | undefined {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload))
    return undefined;

  const value = payload as Record<string, unknown>;
  if (
    !hasOnlyFields(value, [
      'leagueUid',
      'date',
      'mode',
      'timezone',
      'localeOverride',
    ]) ||
    !isNonEmptyString(value.leagueUid) ||
    !isDateInputValue(value.date) ||
    !['previous', 'exact', 'nearest'].includes(value.mode as string) ||
    !isTimezone(value.timezone) ||
    !isLocaleOverride(value.localeOverride)
  ) {
    return undefined;
  }

  return {
    leagueUid: value.leagueUid,
    date: value.date,
    mode: value.mode as GetFixturesPayload['mode'],
    timezone: value.timezone,
    localeOverride: value.localeOverride,
  };
}

function parseGetAvailableLeaguesPayload(
  payload: unknown,
): GetAvailableLeaguesPayload | undefined {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload))
    return undefined;

  const value = payload as Record<string, unknown>;
  return hasOnlyFields(value, ['localeOverride']) &&
    isLocaleOverride(value.localeOverride)
    ? { localeOverride: value.localeOverride }
    : undefined;
}

function parseGetFixtureDatesPayload(
  payload: unknown,
): GetFixtureDatesPayload | undefined {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload))
    return undefined;

  const value = payload as Record<string, unknown>;
  if (
    !hasOnlyFields(value, ['leagueUid', 'startDate', 'endDate', 'timezone']) ||
    !isNonEmptyString(value.leagueUid) ||
    !isDateInputValue(value.startDate) ||
    !isDateInputValue(value.endDate) ||
    value.startDate > value.endDate ||
    !isTimezone(value.timezone)
  ) {
    return undefined;
  }

  return {
    leagueUid: value.leagueUid,
    startDate: value.startDate,
    endDate: value.endDate,
    timezone: value.timezone,
  };
}

function hasOnlyFields(
  value: Record<string, unknown>,
  fields: string[],
): boolean {
  return Object.keys(value).every((key) => fields.includes(key));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isLocaleOverride(value: unknown): value is LocaleOverride | undefined {
  return value === undefined || value === 'ko' || value === 'en';
}

function isTimezone(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;

  try {
    new Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function isDateInputValue(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  );
}

function invalidRequest(): FootballayApiResponse<never> {
  return { ok: false, error: 'Invalid Footballay API request' };
}

function invalidRestoreRequest(): FootballayApiResponse<never> {
  return { ok: false, error: 'Invalid restore state request' };
}
