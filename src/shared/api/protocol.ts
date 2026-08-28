import type {
  AvailableLeagueDto,
  FixtureDto,
  FixtureEventsDto,
  FixtureLineupDto,
  FixtureStatisticsDto,
  FixtureStatusDto,
} from './dto';

export const GET_AVAILABLE_LEAGUES = 'GET_AVAILABLE_LEAGUES';
export const GET_FIXTURES = 'GET_FIXTURES';
export const GET_FIXTURE_DATES = 'GET_FIXTURE_DATES';
export const GET_FIXTURE_STATUS = 'GET_FIXTURE_STATUS';
export const GET_FIXTURE_LINEUP = 'GET_FIXTURE_LINEUP';
export const GET_FIXTURE_EVENTS = 'GET_FIXTURE_EVENTS';
export const GET_FIXTURE_STATISTICS = 'GET_FIXTURE_STATISTICS';

export type LocaleOverride = 'ko' | 'en';
export type GetAvailableLeaguesPayload = {
  localeOverride?: LocaleOverride;
};
export type GetFixturesPayload = {
  leagueUid: string;
  date: string;
  mode: 'previous' | 'exact' | 'nearest';
  timezone: string;
  localeOverride?: LocaleOverride;
};
export type GetFixtureDatesPayload = {
  leagueUid: string;
  startDate: string;
  endDate: string;
  timezone: string;
};
export type FixtureEtagPayload = { fixtureUid: string; etag?: string };
export type LocalizedFixtureEtagPayload = FixtureEtagPayload & {
  localeOverride?: LocaleOverride;
};
export type FootballayApiResponse<T> =
  { ok: true; data: T } | { ok: false; error: string };
export type EtaggedResponse<T> =
  | { type: 'updated'; data: T; etag?: string }
  | { type: 'not-modified'; etag?: string };

export type AvailableLeaguesResponse = FootballayApiResponse<
  AvailableLeagueDto[]
>;
export type FixturesResponse = FootballayApiResponse<FixtureDto[]>;
export type FixtureDatesResponse = FootballayApiResponse<string[]>;
export type FixtureStatusResponse = FootballayApiResponse<
  EtaggedResponse<FixtureStatusDto>
>;
export type FixtureLineupResponse = FootballayApiResponse<
  EtaggedResponse<FixtureLineupDto>
>;
export type FixtureEventsResponse = FootballayApiResponse<
  EtaggedResponse<FixtureEventsDto>
>;
export type FixtureStatisticsResponse = FootballayApiResponse<
  EtaggedResponse<FixtureStatisticsDto>
>;
