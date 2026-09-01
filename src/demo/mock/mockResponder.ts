import {
  GET_AVAILABLE_LEAGUES,
  GET_FIXTURE_DATES,
  GET_FIXTURES,
  GET_FIXTURE_EVENTS,
  GET_FIXTURE_LINEUP,
  GET_FIXTURE_STATISTICS,
  GET_FIXTURE_STATUS,
  type EtaggedResponse,
  type FootballayApiResponse,
} from '@/shared/api/protocol';
import {
  demoEvents,
  demoFixture,
  demoLeague,
  demoLineup,
  demoStatistics,
  demoStatus,
} from './mockData';

type RuntimeRequest = { type?: unknown; payload?: unknown };

function etag(message: RuntimeRequest) {
  const payload = message.payload;
  return payload && typeof payload === 'object' && 'etag' in payload
    ? (payload as { etag?: unknown }).etag
    : undefined;
}

function fixtureResponse<T>(
  message: RuntimeRequest,
  data: T,
  value: string,
): FootballayApiResponse<EtaggedResponse<T>> {
  return {
    ok: true,
    data:
      etag(message) === value
        ? { type: 'not-modified', etag: value }
        : { type: 'updated', data, etag: value },
  };
}

export function handleDemoRuntimeMessage(
  message: unknown,
): FootballayApiResponse<unknown> {
  const request = (message ?? {}) as RuntimeRequest;

  switch (request.type) {
    case GET_AVAILABLE_LEAGUES:
      return { ok: true, data: [demoLeague] };
    case GET_FIXTURES:
      return { ok: true, data: [demoFixture] };
    case GET_FIXTURE_DATES:
      return { ok: true, data: [] };
    case GET_FIXTURE_STATUS:
      return fixtureResponse(request, demoStatus, 'demo-status-v1');
    case GET_FIXTURE_LINEUP:
      return fixtureResponse(request, demoLineup, 'demo-lineup-v1');
    case GET_FIXTURE_EVENTS:
      return fixtureResponse(request, demoEvents, 'demo-events-v1');
    case GET_FIXTURE_STATISTICS:
      return fixtureResponse(request, demoStatistics, 'demo-statistics-v1');
    default:
      return { ok: false, error: 'Invalid Footballay API request' };
  }
}
