import { useEffect } from 'react';
import { MatchDataOverlays } from '@/content/components/match-panel/MatchDataOverlays';
import { MatchSelect } from '@/content/components/match-select/MatchSelect';
import { fixtureSelection } from '@/content/features/fixture-selection';
import { matchData } from '@/content/features/match-data';
import { restoreManager } from '@/content/features/restore/restoreManager';
import { settings, useSettings } from '@/content/features/settings';
import { ContentI18nProvider } from '@/shared/i18n/content';
import '@/styles/colors.css';
import '@/styles/fonts.css';
import './content-app.css';

export function ContentApp() {
  const { hydrated, settings: currentSettings } = useSettings();

  useEffect(() => {
    let mounted = true;

    void settings.initialize().then(async () => {
      if (!mounted) return;

      await fixtureSelection.initialize();
      if (!mounted) return;

      const saved = await restoreManager.load();
      if (!mounted || !saved) return;

      await fixtureSelection.selectLeague(saved.leagueUid);
      if (mounted) fixtureSelection.selectFixture(saved.fixtureUid);
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
