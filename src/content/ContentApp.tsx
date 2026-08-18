import { useEffect } from 'react';
import { MatchDataOverlays } from '@/content/components/match-panel/MatchDataOverlays';
import { MatchSelect } from '@/content/components/match-select/MatchSelect';
import { useMatchPickerStore } from '@/content/stores/matchPickerStore';
import '@/styles/colors.css';
import '@/styles/fonts.css';
import './content-app.css';

export function ContentApp() {
  const loadAvailableLeagues = useMatchPickerStore(
    (state) => state.loadAvailableLeagues,
  );
  useEffect(() => {
    void loadAvailableLeagues();
  }, [loadAvailableLeagues]);

  return (
    <>
      <MatchSelect />
      <MatchDataOverlays />
    </>
  );
}
