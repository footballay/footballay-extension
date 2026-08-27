import * as footballayApi from './footballayApi';
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
  type FootballayApiResponse,
} from '@/shared/api/protocol';

export async function handleRuntimeMessage(
  message: unknown,
): Promise<FootballayApiResponse<unknown>> {
  const request = parseRequestEnvelope(message);
  if (!request) {
    return invalidRequest();
  }

  switch (request.type) {
    case GET_AVAILABLE_LEAGUES:
      if (request.payload !== undefined) return invalidRequest();

      try {
        return { ok: true, data: await footballayApi.getAvailableLeagues() };
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
      return requestFixtureData(
        request.payload,
        footballayApi.getFixtureStatus,
      );
    case GET_FIXTURE_LINEUP:
      return requestFixtureData(
        request.payload,
        footballayApi.getFixtureLineup,
      );
    case GET_FIXTURE_EVENTS:
      return requestFixtureData(
        request.payload,
        footballayApi.getFixtureEvents,
      );
    case GET_FIXTURE_STATISTICS:
      return requestFixtureData(
        request.payload,
        footballayApi.getFixtureStatistics,
      );

    default:
      return invalidRequest();
  }
}

async function requestFixtureData<T>(
  payload: unknown,
  request: (fixtureUid: string, etag?: string) => Promise<T>,
): Promise<FootballayApiResponse<T>> {
  const fixture = parseFixturePayload(payload);
  if (!fixture) return invalidRequest();

  try {
    return { ok: true, data: await request(fixture.fixtureUid, fixture.etag) };
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
): { fixtureUid: string; etag?: string } | undefined {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload))
    return undefined;
  const value = payload as Record<string, unknown>;
  return hasOnlyFields(value, ['fixtureUid', 'etag']) &&
    isNonEmptyString(value.fixtureUid) &&
    (value.etag === undefined || typeof value.etag === 'string')
    ? { fixtureUid: value.fixtureUid, etag: value.etag }
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
    !hasOnlyFields(value, ['leagueUid', 'date', 'mode', 'timezone']) ||
    !isNonEmptyString(value.leagueUid) ||
    !isDateInputValue(value.date) ||
    !['previous', 'exact', 'nearest'].includes(value.mode as string) ||
    !isNonEmptyString(value.timezone)
  ) {
    return undefined;
  }

  return {
    leagueUid: value.leagueUid,
    date: value.date,
    mode: value.mode as GetFixturesPayload['mode'],
    timezone: value.timezone,
  };
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
    !isNonEmptyString(value.timezone)
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
