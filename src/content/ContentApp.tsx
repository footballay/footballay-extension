import { useEffect } from 'react';
import { MatchDataOverlays } from '@/content/components/match-panel/MatchDataOverlays';
import { MatchSelect } from '@/content/components/match-select/MatchSelect';
import { startMatchDataSync } from '@/content/matchDataSync';
import { useMatchPickerStore } from '@/content/stores/matchPickerStore';
import { useSettingsStore } from '@/content/stores/settingsStore';
import '@/styles/colors.css';
import '@/styles/fonts.css';
import './content-app.css';

export function ContentApp() {
  const hydrated = useSettingsStore((state) => state.hydrated);
  const hydrate = useSettingsStore((state) => state.hydrate);
  const loadAvailableLeagues = useMatchPickerStore(
    (state) => state.loadAvailableLeagues,
  );

  useEffect(() => {
    if (!hydrated) {
      void hydrate();
      return;
    }

    void loadAvailableLeagues();
    startMatchDataSync();
  }, [hydrate, hydrated, loadAvailableLeagues]);

  if (!hydrated) return null;

  return (
    <>
      <MatchSelect />
      <MatchDataOverlays />
    </>
  );
}
