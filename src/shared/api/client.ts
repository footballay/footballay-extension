import {
  GET_AVAILABLE_LEAGUES,
  GET_FIXTURE_DATES,
  GET_FIXTURES,
  GET_FIXTURE_EVENTS,
  GET_FIXTURE_LINEUP,
  GET_FIXTURE_STATISTICS,
  GET_FIXTURE_STATUS,
  type AvailableLeaguesResponse,
  type FootballayApiResponse,
  type FixtureDatesResponse,
  type FixtureEtagPayload,
  type FixtureEventsResponse,
  type FixtureLineupResponse,
  type FixtureStatisticsResponse,
  type FixtureStatusResponse,
  type FixturesResponse,
  type GetAvailableLeaguesPayload,
  type GetFixtureDatesPayload,
  type GetFixturesPayload,
  type LocalizedFixtureEtagPayload,
} from './protocol';

export function requestAvailableLeagues(
  payload?: GetAvailableLeaguesPayload,
): Promise<AvailableLeaguesResponse> {
  return chrome.runtime.sendMessage({
    type: GET_AVAILABLE_LEAGUES,
    ...(payload && { payload }),
  }) as Promise<AvailableLeaguesResponse>;
}

export function requestFixtures(
  payload: GetFixturesPayload,
): Promise<FixturesResponse> {
  return chrome.runtime.sendMessage({
    type: GET_FIXTURES,
    payload,
  }) as Promise<FixturesResponse>;
}

export function requestFixtureDates(
  payload: GetFixtureDatesPayload,
): Promise<FixtureDatesResponse> {
  return chrome.runtime.sendMessage({
    type: GET_FIXTURE_DATES,
    payload,
  }) as Promise<FixtureDatesResponse>;
}

function requestFixtureData<T>(
  type: string,
  payload: FixtureEtagPayload,
): Promise<FootballayApiResponse<T>> {
  return chrome.runtime.sendMessage({
    type,
    payload,
  }) as Promise<FootballayApiResponse<T>>;
}

export function requestFixtureStatus(
  payload: FixtureEtagPayload,
): Promise<FixtureStatusResponse> {
  return requestFixtureData(GET_FIXTURE_STATUS, payload);
}

export function requestFixtureLineup(
  payload: LocalizedFixtureEtagPayload,
): Promise<FixtureLineupResponse> {
  return requestFixtureData(GET_FIXTURE_LINEUP, payload);
}

export function requestFixtureEvents(
  payload: LocalizedFixtureEtagPayload,
): Promise<FixtureEventsResponse> {
  return requestFixtureData(GET_FIXTURE_EVENTS, payload);
}

export function requestFixtureStatistics(
  payload: LocalizedFixtureEtagPayload,
): Promise<FixtureStatisticsResponse> {
  return requestFixtureData(GET_FIXTURE_STATISTICS, payload);
}
