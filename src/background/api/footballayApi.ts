import axios from 'axios';
import type {
  AvailableLeagueDto,
  FixtureDto,
  GetFixturesPayload,
  MatchDataDto,
} from '@/shared/footballayApiProtocol';

const footballayApi = axios.create({
  baseURL:
    import.meta.env.VITE_FOOTBALLAY_API_BASE_URL?.trim() ||
    'https://api.footballay.com',
  headers: { Accept: 'application/json' },
});

/**
 * Privileged HTTP transport only. It returns raw data for the extension
 * message contract and holds no Content application state.
 */
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

export async function getMatchData(fixtureUid: string): Promise<MatchDataDto> {
  const fixturePath = `/v1/football/fixtures/${encodeURIComponent(fixtureUid)}`;
  const [info, status, statistics, events, lineup] = await Promise.all([
    footballayApi.get<MatchDataDto['info']>(`${fixturePath}/info`),
    footballayApi.get<MatchDataDto['status']>(`${fixturePath}/status`),
    footballayApi.get<MatchDataDto['statistics']>(`${fixturePath}/statistics`),
    footballayApi.get<MatchDataDto['events']>(`${fixturePath}/events`),
    footballayApi.get<MatchDataDto['lineup']>(`${fixturePath}/lineup`),
  ]);
  return {
    info: info.data,
    status: status.data,
    statistics: statistics.data,
    events: events.data,
    lineup: lineup.data,
  };
}
