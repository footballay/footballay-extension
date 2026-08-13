import { create } from 'zustand';
import {
  requestFixtureEvents,
  requestFixtureLineup,
  requestFixtureStatistics,
  requestFixtureStatus,
  type FixtureEventsDto,
  type FixtureLineupDto,
  type FixtureStatisticsDto,
  type FixtureStatusDto,
} from '@/shared/footballayApiProtocol';
import type { LoadStatus } from './matchPickerStore';

type MatchDataStore = {
  fixtureUid?: string;
  statusData?: FixtureStatusDto;
  lineup?: FixtureLineupDto;
  events?: FixtureEventsDto;
  statistics?: FixtureStatisticsDto;
  etags: {
    status?: string;
    lineup?: string;
    events?: string;
    statistics?: string;
  };
  status: LoadStatus;
  error?: string;
  refreshMatchData: () => Promise<void>;
};

let latestRequestId = 0;

export const useMatchDataStore = create<MatchDataStore>((set, get) => {
  async function refreshMatchData() {
    const { fixtureUid, etags } = get();
    if (!fixtureUid) return;

    const requestId = ++latestRequestId;
    const results = await Promise.allSettled([
      requestFixtureStatus({ fixtureUid, etag: etags.status }),
      requestFixtureLineup({ fixtureUid, etag: etags.lineup }),
      requestFixtureEvents({ fixtureUid, etag: etags.events }),
      requestFixtureStatistics({ fixtureUid, etag: etags.statistics }),
    ]);
    if (requestId !== latestRequestId || get().fixtureUid !== fixtureUid)
      return;

    const errors = results.flatMap((result) => {
      if (result.status === 'rejected') {
        return result.reason instanceof Error
          ? result.reason.message
          : 'Unable to refresh match data';
      }
      return result.value.ok ? [] : result.value.error;
    });
    const [status, lineup, events, statistics] = results;
    set((state) => ({
      statusData:
        status.status === 'fulfilled' &&
        status.value.ok &&
        status.value.data.type === 'updated'
          ? status.value.data.data
          : state.statusData,
      lineup:
        lineup.status === 'fulfilled' &&
        lineup.value.ok &&
        lineup.value.data.type === 'updated'
          ? lineup.value.data.data
          : state.lineup,
      events:
        events.status === 'fulfilled' &&
        events.value.ok &&
        events.value.data.type === 'updated'
          ? events.value.data.data
          : state.events,
      statistics:
        statistics.status === 'fulfilled' &&
        statistics.value.ok &&
        statistics.value.data.type === 'updated'
          ? statistics.value.data.data
          : state.statistics,
      etags: {
        status:
          status.status === 'fulfilled' &&
          status.value.ok &&
          (status.value.data.type === 'updated' ||
            status.value.data.etag !== undefined)
            ? status.value.data.etag
            : state.etags.status,
        lineup:
          lineup.status === 'fulfilled' &&
          lineup.value.ok &&
          (lineup.value.data.type === 'updated' ||
            lineup.value.data.etag !== undefined)
            ? lineup.value.data.etag
            : state.etags.lineup,
        events:
          events.status === 'fulfilled' &&
          events.value.ok &&
          (events.value.data.type === 'updated' ||
            events.value.data.etag !== undefined)
            ? events.value.data.etag
            : state.etags.events,
        statistics:
          statistics.status === 'fulfilled' &&
          statistics.value.ok &&
          (statistics.value.data.type === 'updated' ||
            statistics.value.data.etag !== undefined)
            ? statistics.value.data.etag
            : state.etags.statistics,
      },
      status: errors.length === 4 ? 'error' : 'ready',
      error: errors[0],
    }));
  }

  return {
    etags: {},
    status: 'idle',
    refreshMatchData,
  };
});

export function setMatchDataFixture(fixtureUid?: string) {
  ++latestRequestId;
  useMatchDataStore.setState({
    fixtureUid,
    statusData: undefined,
    lineup: undefined,
    events: undefined,
    statistics: undefined,
    etags: {},
    status: fixtureUid ? 'loading' : 'idle',
    error: undefined,
  });
}
