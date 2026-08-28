import { useEffect, useRef } from 'react';
import { MatchDataOverlays } from '@/content/components/match-panel/MatchDataOverlays';
import { MatchSelect } from '@/content/components/match-select/MatchSelect';
import { startMatchDataSync } from '@/content/matchDataSync';
import { useMatchPickerStore } from '@/content/stores/matchPickerStore';
import { useMatchDataStore } from '@/content/stores/matchDataStore';
import { useSettingsStore } from '@/content/stores/settingsStore';
import { ContentI18nProvider } from '@/shared/i18n/content';
import '@/styles/colors.css';
import '@/styles/fonts.css';
import './content-app.css';

export function ContentApp() {
  const hydrated = useSettingsStore((state) => state.hydrated);
  const settings = useSettingsStore((state) => state.settings);
  const hydrate = useSettingsStore((state) => state.hydrate);
  const loadAvailableLeagues = useMatchPickerStore(
    (state) => state.loadAvailableLeagues,
  );
  const reloadFixturesForLocale = useMatchPickerStore(
    (state) => state.reloadFixturesForLocale,
  );
  const reloadFixturesForTimezone = useMatchPickerStore(
    (state) => state.reloadFixturesForTimezone,
  );
  const reloadLocalizedMatchData = useMatchDataStore(
    (state) => state.reloadLocalizedMatchData,
  );
  const previousSettings = useRef(settings);
  const settingsReady = useRef(false);

  useEffect(() => {
    if (!hydrated) {
      void hydrate();
      return;
    }

    void loadAvailableLeagues();
    startMatchDataSync();
  }, [hydrate, hydrated, loadAvailableLeagues]);

  useEffect(() => {
    if (!hydrated) return;
    if (!settingsReady.current) {
      settingsReady.current = true;
      previousSettings.current = settings;
      return;
    }

    const previous = previousSettings.current;
    previousSettings.current = settings;
    const localeChanged = previous.locale !== settings.locale;
    const timezoneChanged = previous.timezone !== settings.timezone;
    if (!localeChanged && !timezoneChanged) return;

    if (localeChanged) {
      void loadAvailableLeagues();
      void reloadLocalizedMatchData();
    }
    if (timezoneChanged) void reloadFixturesForTimezone();
    else if (localeChanged) void reloadFixturesForLocale();
  }, [
    hydrated,
    loadAvailableLeagues,
    reloadFixturesForLocale,
    reloadFixturesForTimezone,
    reloadLocalizedMatchData,
    settings,
  ]);

  if (!hydrated) return null;

  return (
    <ContentI18nProvider setting={settings.locale}>
      <MatchSelect />
      <MatchDataOverlays />
    </ContentI18nProvider>
  );
}
