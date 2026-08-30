import { useEffect } from 'react';
import { MatchDataOverlays } from '@/content/components/match-panel/MatchDataOverlays';
import { MatchSelect } from '@/content/components/match-select/MatchSelect';
import { fixtureSelection } from '@/content/features/fixture-selection';
import { matchData } from '@/content/features/match-data';
import { settings, useSettings } from '@/content/features/settings';
import { ContentI18nProvider } from '@/shared/i18n/content';
import '@/styles/colors.css';
import '@/styles/fonts.css';
import './content-app.css';

export function ContentApp() {
  const { hydrated, settings: currentSettings } = useSettings();

  useEffect(() => {
    let mounted = true;

    void settings.initialize().then(() => {
      if (mounted) void fixtureSelection.initialize();
    });

    return () => {
      mounted = false;
      fixtureSelection.dispose();
      matchData.dispose();
      settings.dispose();
    };
  }, []);

  if (!hydrated) return null;

  return (
    <ContentI18nProvider setting={currentSettings.locale}>
      {currentSettings.enabled !== false && (
        <>
          <MatchSelect />
          <MatchDataOverlays />
        </>
      )}
    </ContentI18nProvider>
  );
}
