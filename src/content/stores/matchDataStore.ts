import { create } from 'zustand';
import {
  requestFixtureEvents,
  requestFixtureLineup,
  requestFixtureStatistics,
  requestFixtureStatus,
} from '@/shared/api/client';
import type {
  EtaggedResponse,
  FootballayApiResponse,
} from '@/shared/api/protocol';
import type {
  FixtureEventsDto,
  FixtureLineupDto,
  FixtureStatisticsDto,
  FixtureStatusDto,
} from '@/shared/api/dto';
import type { LoadStatus } from './matchPickerStore';

export type MatchDataResource<T> = {
  data?: T;
  etag?: string;
  loadStatus: LoadStatus;
  error?: string;
};

type MatchDataStore = {
  fixtureUid?: string;
  status: MatchDataResource<FixtureStatusDto>;
  lineup: MatchDataResource<FixtureLineupDto>;
  events: MatchDataResource<FixtureEventsDto>;
  statistics: MatchDataResource<FixtureStatisticsDto>;
  refreshMatchData: () => Promise<void>;
};

type FixtureDataResponse<T> = FootballayApiResponse<EtaggedResponse<T>>;

let latestRequestId = 0;

function emptyResource(loadStatus: LoadStatus): MatchDataResource<never> {
  return { loadStatus };
}

function nextResource<T>(
  resource: MatchDataResource<T>,
  result: PromiseSettledResult<FixtureDataResponse<T>>,
): MatchDataResource<T> {
  if (result.status === 'rejected') {
    return {
      ...resource,
      loadStatus: 'error',
      error:
        result.reason instanceof Error
          ? result.reason.message
          : 'Unable to refresh match data',
    };
  }
  if (!result.value.ok) {
    return { ...resource, loadStatus: 'error', error: result.value.error };
  }

  const response = result.value.data;
  return {
    data: response.type === 'updated' ? response.data : resource.data,
    etag: response.etag === undefined ? resource.etag : response.etag,
    loadStatus: 'ready',
  };
}

export const useMatchDataStore = create<MatchDataStore>((set, get) => {
  async function refreshMatchData() {
    const { fixtureUid, status, lineup, events, statistics } = get();
    if (!fixtureUid) return;

    const requestId = ++latestRequestId;
    const results = await Promise.allSettled([
      requestFixtureStatus({ fixtureUid, etag: status.etag }),
      requestFixtureLineup({ fixtureUid, etag: lineup.etag }),
      requestFixtureEvents({ fixtureUid, etag: events.etag }),
      requestFixtureStatistics({ fixtureUid, etag: statistics.etag }),
    ]);
    if (requestId !== latestRequestId || get().fixtureUid !== fixtureUid)
      return;

    const [statusResult, lineupResult, eventsResult, statisticsResult] =
      results;
    set((state) => ({
      status: nextResource(state.status, statusResult),
      lineup: nextResource(state.lineup, lineupResult),
      events: nextResource(state.events, eventsResult),
      statistics: nextResource(state.statistics, statisticsResult),
    }));
  }

  return {
    status: emptyResource('idle'),
    lineup: emptyResource('idle'),
    events: emptyResource('idle'),
    statistics: emptyResource('idle'),
    refreshMatchData,
  };
});

export function setMatchDataFixture(fixtureUid?: string) {
  ++latestRequestId;
  const loadStatus = fixtureUid ? 'loading' : 'idle';
  useMatchDataStore.setState({
    fixtureUid,
    status: emptyResource(loadStatus),
    lineup: emptyResource(loadStatus),
    events: emptyResource(loadStatus),
    statistics: emptyResource(loadStatus),
  });
}
