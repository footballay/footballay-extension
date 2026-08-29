import {
  requestFixtureEvents,
  requestFixtureLineup,
  requestFixtureStatistics,
  requestFixtureStatus,
} from '@/shared/api/client';
import type { FixtureDto } from '@/shared/api/dto';
import type {
  EtaggedResponse,
  FootballayApiResponse,
} from '@/shared/api/protocol';
import { getFixtureStatusGroup } from '@/shared/football/fixtureStatus';
import { toLocaleOverride } from '@/shared/settings/resolution';
import { getSettings } from '@/content/features/settings';
import {
  createMatchDataState,
  emptyResource,
  matchDataStore,
  type MatchDataResource,
} from './matchDataStore';

const POLLING_INTERVAL_MS = 20_000;

type FixtureDataResponse<T> = FootballayApiResponse<EtaggedResponse<T>>;

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
    return {
      ...resource,
      loadStatus: 'error',
      error: result.value.error,
    };
  }

  const response = result.value.data;
  return {
    data: response.type === 'updated' ? response.data : resource.data,
    etag: response.etag === undefined ? resource.etag : response.etag,
    loadStatus: 'ready',
  };
}

class MatchDataManager {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private pollingGeneration = 0;
  private refreshingGeneration: number | undefined;
  private latestRequestId = 0;
  private localizedGeneration = 0;
  private completed = false;
  private visibilityListening = false;

  activateFixture(fixtureInfo: FixtureDto): void {
    const current = matchDataStore.getState().fixtureInfo;
    if (current?.uid === fixtureInfo.uid) {
      matchDataStore.setState({ fixtureInfo });
      return;
    }

    this.stopPolling();
    ++this.latestRequestId;
    ++this.localizedGeneration;
    matchDataStore.setState(createMatchDataState(fixtureInfo));
    this.startPolling();
  }

  updateFixtureInfo(fixtureInfo: FixtureDto): void {
    if (matchDataStore.getState().fixtureInfo?.uid !== fixtureInfo.uid) return;
    matchDataStore.setState({ fixtureInfo });
  }

  clearFixture(): void {
    this.stopPolling();
    ++this.latestRequestId;
    ++this.localizedGeneration;
    matchDataStore.setState(createMatchDataState());
  }

  dispose(): void {
    this.clearFixture();
  }

  async refresh(): Promise<void> {
    const state = matchDataStore.getState();
    const fixtureUid = state.fixtureInfo?.uid;
    if (!fixtureUid) return;

    const requestId = ++this.latestRequestId;
    const localizedGeneration = this.localizedGeneration;
    const localeOverride = toLocaleOverride(getSettings().locale);
    const results = await Promise.allSettled([
      requestFixtureStatus({ fixtureUid, etag: state.status.etag }),
      requestFixtureLineup({
        fixtureUid,
        etag: state.lineup.etag,
        ...(localeOverride && { localeOverride }),
      }),
      requestFixtureEvents({
        fixtureUid,
        etag: state.events.etag,
        ...(localeOverride && { localeOverride }),
      }),
      requestFixtureStatistics({
        fixtureUid,
        etag: state.statistics.etag,
        ...(localeOverride && { localeOverride }),
      }),
    ]);

    if (requestId !== this.latestRequestId) return;
    if (matchDataStore.getState().fixtureInfo?.uid !== fixtureUid) return;

    const [statusResult, lineupResult, eventsResult, statisticsResult] =
      results;
    matchDataStore.setState((current) => ({
      status: nextResource(current.status, statusResult),
      ...(localizedGeneration === this.localizedGeneration && {
        lineup: nextResource(current.lineup, lineupResult),
        events: nextResource(current.events, eventsResult),
        statistics: nextResource(current.statistics, statisticsResult),
      }),
    }));
  }

  async reloadLocalized(): Promise<void> {
    const fixtureUid = matchDataStore.getState().fixtureInfo?.uid;
    if (!fixtureUid) return;

    const generation = ++this.localizedGeneration;
    matchDataStore.setState({
      lineup: emptyResource('loading'),
      events: emptyResource('loading'),
      statistics: emptyResource('loading'),
    });
    const localeOverride = toLocaleOverride(getSettings().locale);
    const results = await Promise.allSettled([
      requestFixtureLineup({
        fixtureUid,
        ...(localeOverride && { localeOverride }),
      }),
      requestFixtureEvents({
        fixtureUid,
        ...(localeOverride && { localeOverride }),
      }),
      requestFixtureStatistics({
        fixtureUid,
        ...(localeOverride && { localeOverride }),
      }),
    ]);

    if (generation !== this.localizedGeneration) return;
    if (matchDataStore.getState().fixtureInfo?.uid !== fixtureUid) return;

    const [lineupResult, eventsResult, statisticsResult] = results;
    matchDataStore.setState((current) => ({
      lineup: nextResource(current.lineup, lineupResult),
      events: nextResource(current.events, eventsResult),
      statistics: nextResource(current.statistics, statisticsResult),
    }));
  }

  private startPolling(): void {
    this.completed = false;
    const generation = ++this.pollingGeneration;
    this.attachVisibilityListener();
    void this.refreshAndSchedule(generation);
  }

  private stopPolling(): void {
    ++this.pollingGeneration;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    this.refreshingGeneration = undefined;
    this.completed = false;
    this.detachVisibilityListener();
  }

  private async refreshAndSchedule(generation: number): Promise<void> {
    if (generation !== this.pollingGeneration) return;
    if (this.completed || this.documentHidden()) return;
    if (this.refreshingGeneration === generation) return;

    this.refreshingGeneration = generation;
    try {
      await this.refresh();
    } finally {
      if (this.refreshingGeneration === generation) {
        this.refreshingGeneration = undefined;
      }
    }

    if (generation !== this.pollingGeneration) return;

    const status =
      matchDataStore.getState().status.data?.liveStatus.shortStatus ?? '';
    const statusGroup = getFixtureStatusGroup(status);
    this.completed = statusGroup === 'finished' || statusGroup === 'not-played';

    if (!this.completed && !this.documentHidden()) {
      this.timer = setTimeout(
        () => void this.refreshAndSchedule(generation),
        POLLING_INTERVAL_MS,
      );
    }
  }

  private readonly handleVisibilityChange = () => {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    if (!this.completed && !this.documentHidden()) {
      void this.refreshAndSchedule(this.pollingGeneration);
    }
  };

  private attachVisibilityListener(): void {
    if (this.visibilityListening || typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.visibilityListening = true;
  }

  private detachVisibilityListener(): void {
    if (!this.visibilityListening || typeof document === 'undefined') return;
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange,
    );
    this.visibilityListening = false;
  }

  private documentHidden(): boolean {
    return typeof document !== 'undefined' && document.hidden;
  }
}

export const matchDataManager = new MatchDataManager();
