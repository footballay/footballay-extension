import { useStore } from 'zustand';
import type { FixtureDto } from '@/shared/api/dto';
import { matchDataManager } from './matchDataManager';
import { matchDataStore } from './matchDataStore';
import { buildLineupViewModel } from './model/lineupViewModel';
import {
  buildEventsViewModel,
  matchMinuteToTimelineValue,
  timelineMax,
} from './model/eventsViewModel';
import { buildStatisticsViewModel } from './model/statisticsViewModel';

export type {
  LineupPlayer,
  LineupTeamView,
  LineupViewModel,
} from './model/lineupViewModel';
export type { DisplayEvent, EventsViewModel } from './model/eventsViewModel';
export type {
  StatisticLabel,
  StatisticRow,
  StatisticsViewModel,
} from './model/statisticsViewModel';
export { matchMinuteToTimelineValue, timelineMax };

export const matchData = Object.freeze({
  activateFixture: (fixtureInfo: FixtureDto) =>
    matchDataManager.activateFixture(fixtureInfo),
  updateFixtureInfo: (fixtureInfo: FixtureDto) =>
    matchDataManager.updateFixtureInfo(fixtureInfo),
  setEnabled: (enabled: boolean) => matchDataManager.setEnabled(enabled),
  clearFixture: () => matchDataManager.clearFixture(),
  refresh: () => matchDataManager.refresh(),
  reloadLocalized: () => matchDataManager.reloadLocalized(),
  dispose: () => matchDataManager.dispose(),
});

export function useMatchPanel() {
  const state = useStore(matchDataStore);

  return {
    fixtureInfo: state.fixtureInfo,
    status: {
      data: state.status.data,
      loadStatus: state.status.loadStatus,
      error: state.status.error,
    },
    lineup: {
      data: buildLineupViewModel(
        state.lineup.data,
        state.events.data,
        state.statistics.data,
      ),
      loadStatus: state.lineup.loadStatus,
      error: state.lineup.error,
    },
    events: {
      data: buildEventsViewModel(
        state.events.data,
        state.statistics.data,
        state.fixtureInfo,
      ),
      loadStatus: state.events.loadStatus,
      error: state.events.error,
    },
    statistics: {
      data: buildStatisticsViewModel(state.statistics.data),
      loadStatus: state.statistics.loadStatus,
      error: state.statistics.error,
    },
  };
}
