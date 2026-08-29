import { createStore } from 'zustand/vanilla';
import type { AvailableLeagueDto, FixtureDto } from '@/shared/api/dto';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export type FixtureSelectionState = {
  leagues: AvailableLeagueDto[];
  leagueStatus: LoadStatus;
  leagueError?: string;

  fixtures: FixtureDto[];
  fixtureDates: string[];
  fixtureStatus: LoadStatus;
  fixtureError?: string;

  selectedLeagueUid?: string;
  selectedDate?: string;
  selectedFixtureUid?: string;
};

export function createFixtureSelectionState(): FixtureSelectionState {
  return {
    leagues: [],
    leagueStatus: 'idle',
    leagueError: undefined,
    fixtures: [],
    fixtureDates: [],
    fixtureStatus: 'idle',
    fixtureError: undefined,
    selectedLeagueUid: undefined,
    selectedDate: undefined,
    selectedFixtureUid: undefined,
  };
}

export const fixtureSelectionStore = createStore<FixtureSelectionState>(
  createFixtureSelectionState,
);
