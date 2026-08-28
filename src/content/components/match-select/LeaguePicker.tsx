import { useMatchPickerStore } from '@/content/stores/matchPickerStore';
import { t, useContentLocale } from '@/shared/i18n/content';

type LeaguePickerProps = {
  onSelect: () => void;
};

export function LeaguePicker({ onSelect }: LeaguePickerProps) {
  const locale = useContentLocale();
  const leagues = useMatchPickerStore((state) => state.leagues);
  const leagueStatus = useMatchPickerStore((state) => state.leagueStatus);
  const leagueError = useMatchPickerStore((state) => state.leagueError);
  const selectedLeagueUid = useMatchPickerStore(
    (state) => state.selectedLeagueUid,
  );
  const loadAvailableLeagues = useMatchPickerStore(
    (state) => state.loadAvailableLeagues,
  );
  const selectLeagueAndLoadFixtures = useMatchPickerStore(
    (state) => state.selectLeagueAndLoadFixtures,
  );

  return (
    <section className="footballay-league-section">
      {leagueStatus === 'loading' && (
        <p className="footballay-content-status" role="status">
          {t(locale, 'leagueLoading')}
        </p>
      )}
      {leagueStatus === 'error' && (
        <div className="footballay-content-status" role="alert">
          <p>{t(locale, 'leagueError', { error: leagueError ?? '' })}</p>
          <button type="button" onClick={() => void loadAvailableLeagues()}>
            {t(locale, 'retry')}
          </button>
        </div>
      )}
      {leagueStatus === 'ready' && leagues.length === 0 && (
        <p className="footballay-content-status">{t(locale, 'noLeagues')}</p>
      )}
      {leagues.length > 0 && (
        <div
          className="footballay-league-list"
          role="listbox"
          aria-label={t(locale, 'availableLeagues')}
        >
          {leagues.map((league) => (
            <button
              key={league.uid}
              className={`footballay-league-button${league.uid === selectedLeagueUid ? ' footballay-league-button--selected' : ''}`}
              type="button"
              aria-pressed={league.uid === selectedLeagueUid}
              onClick={() => {
                onSelect();
                void selectLeagueAndLoadFixtures(league.uid);
              }}
            >
              {league.name}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
