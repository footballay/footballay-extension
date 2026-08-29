import { createStore } from 'zustand/vanilla';
import type {
  FixtureDto,
  FixtureEventsDto,
  FixtureLineupDto,
  FixtureStatisticsDto,
  FixtureStatusDto,
} from '@/shared/api/dto';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export type MatchDataResource<T> = {
  data?: T;
  etag?: string;
  loadStatus: LoadStatus;
  error?: string;
};

export type MatchDataState = {
  fixtureInfo?: FixtureDto;
  status: MatchDataResource<FixtureStatusDto>;
  lineup: MatchDataResource<FixtureLineupDto>;
  events: MatchDataResource<FixtureEventsDto>;
  statistics: MatchDataResource<FixtureStatisticsDto>;
};

export function emptyResource<T>(loadStatus: LoadStatus): MatchDataResource<T> {
  return { loadStatus };
}

export function createMatchDataState(fixtureInfo?: FixtureDto): MatchDataState {
  const loadStatus: LoadStatus = fixtureInfo ? 'loading' : 'idle';
  return {
    fixtureInfo,
    status: emptyResource(loadStatus),
    lineup: emptyResource(loadStatus),
    events: emptyResource(loadStatus),
    statistics: emptyResource(loadStatus),
  };
}

export const matchDataStore = createStore<MatchDataState>(() =>
  createMatchDataState(),
);
