import { useStore } from 'zustand';
import { resolveTimezone } from '@/shared/settings/resolution';
import { useSettings } from '@/content/features/settings';
import {
  fixtureSelectionManager,
  type FixtureSelectionSettingsChange,
} from './fixtureSelectionManager';
import { fixtureSelectionStore } from './fixtureSelectionStore';

export const fixtureSelection = Object.freeze({
  initialize: () => fixtureSelectionManager.initialize(),
  dispose: () => fixtureSelectionManager.dispose(),
  loadAvailableLeagues: () => fixtureSelectionManager.loadAvailableLeagues(),
  selectLeague: (leagueUid: string) =>
    fixtureSelectionManager.selectLeague(leagueUid),
  navigateDate: (direction: 'previous' | 'next') =>
    fixtureSelectionManager.navigateDate(direction),
  selectDate: (date: string) => fixtureSelectionManager.selectDate(date),
  loadFixtureDates: (date: string) =>
    fixtureSelectionManager.loadFixtureDates(date),
  selectFixture: (fixtureUid: string) =>
    fixtureSelectionManager.selectFixture(fixtureUid),
  reloadForSettings: (change: FixtureSelectionSettingsChange) =>
    fixtureSelectionManager.reloadForSettings(change),
});

export function useFixtureSelection() {
  const state = useStore(fixtureSelectionStore);
  const { settings } = useSettings();
  const timezone = resolveTimezone(settings.timezone);

  return {
    ...state,
    timezone,
    loadAvailableLeagues: fixtureSelection.loadAvailableLeagues,
    selectLeague: fixtureSelection.selectLeague,
    navigateDate: fixtureSelection.navigateDate,
    selectDate: fixtureSelection.selectDate,
    loadFixtureDates: fixtureSelection.loadFixtureDates,
    selectFixture: fixtureSelection.selectFixture,
  };
}
