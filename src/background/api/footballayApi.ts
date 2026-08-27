import axios from 'axios';
import type {
  AvailableLeagueDto,
  FixtureDto,
  FixtureEventsDto,
  FixtureLineupDto,
  FixtureStatisticsDto,
  FixtureStatusDto,
} from '@/shared/api/dto';
import type {
  EtaggedResponse,
  GetFixtureDatesPayload,
  GetFixturesPayload,
} from '@/shared/api/protocol';

const footballayApi = axios.create({
  baseURL:
    import.meta.env.VITE_FOOTBALLAY_API_BASE_URL?.trim() ||
    'https://api.footballay.com',
  headers: { Accept: 'application/json' },
});

export async function getAvailableLeagues(): Promise<AvailableLeagueDto[]> {
  const response = await footballayApi.get<AvailableLeagueDto[]>(
    '/v1/football/leagues/available',
  );
  return response.data;
}

export async function getFixtures({
  leagueUid,
  date,
  mode,
  timezone,
}: GetFixturesPayload): Promise<FixtureDto[]> {
  const query = new URLSearchParams({ date, mode, timezone });
  const response = await footballayApi.get<FixtureDto[]>(
    `/v1/football/leagues/${encodeURIComponent(leagueUid)}/fixtures?${query}`,
  );
  return response.data;
}

export async function getFixtureDates({
  leagueUid,
  startDate,
  endDate,
  timezone,
}: GetFixtureDatesPayload): Promise<string[]> {
  const query = new URLSearchParams({ startDate, endDate, timezone });
  const response = await footballayApi.get<{ dates: string[] }>(
    `/v1/football/leagues/${encodeURIComponent(leagueUid)}/fixtures/dates?${query}`,
  );
  return response.data.dates;
}

export function getFixtureStatus(
  fixtureUid: string,
  etag?: string,
): Promise<EtaggedResponse<FixtureStatusDto>> {
  return getEtaggedJson(fixturePath(fixtureUid, 'status'), etag);
}

export function getFixtureLineup(
  fixtureUid: string,
  etag?: string,
): Promise<EtaggedResponse<FixtureLineupDto>> {
  return getEtaggedJson(fixturePath(fixtureUid, 'lineup'), etag);
}

export function getFixtureEvents(
  fixtureUid: string,
  etag?: string,
): Promise<EtaggedResponse<FixtureEventsDto>> {
  return getEtaggedJson(fixturePath(fixtureUid, 'events'), etag);
}

export function getFixtureStatistics(
  fixtureUid: string,
  etag?: string,
): Promise<EtaggedResponse<FixtureStatisticsDto>> {
  return getEtaggedJson(fixturePath(fixtureUid, 'statistics'), etag);
}

function fixturePath(fixtureUid: string, endpoint: string): string {
  return `/v1/football/fixtures/${encodeURIComponent(fixtureUid)}/${endpoint}`;
}

function getEtaggedJson<T>(
  path: string,
  etag?: string,
): Promise<EtaggedResponse<T>> {
  return footballayApi
    .get<T>(path, {
      headers: etag ? { 'If-None-Match': etag } : undefined,
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 304,
    })
    .then((response) => {
      const nextEtag = getResponseHeader(response.headers, 'etag');
      return response.status === 304
        ? { type: 'not-modified', etag: nextEtag }
        : { type: 'updated', data: response.data, etag: nextEtag };
    });
}

function getResponseHeader(headers: unknown, name: string): string | undefined {
  if (!headers || typeof headers !== 'object') return undefined;
  const value =
    (headers as { get?: (key: string) => unknown }).get?.(name) ??
    (headers as Record<string, unknown>)[name.toLowerCase()] ??
    (headers as Record<string, unknown>)[name];
  if (Array.isArray(value))
    return value[0] === undefined ? undefined : String(value[0]);
  return value === undefined || value === null ? undefined : String(value);
}
