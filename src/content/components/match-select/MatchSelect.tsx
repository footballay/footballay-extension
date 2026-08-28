import { CalendarDays, X } from 'lucide-react';
import { useState } from 'react';
import { useMatchPickerStore } from '@/content/stores/matchPickerStore';
import { t, useContentLocale } from '@/shared/i18n/content';
import { FixturePicker } from './FixturePicker';
import { LeaguePicker } from './LeaguePicker';
import './match-select.css';

type MatchSelectView = 'League' | 'Match' | 'DatePicker';

export function MatchSelect() {
  const locale = useContentLocale();
  const [view, setView] = useState<MatchSelectView>('League');
  const [collapsed, setCollapsed] = useState(false);
  const selectedDate = useMatchPickerStore((state) => state.selectedDate);
  const selectedLeagueUid = useMatchPickerStore(
    (state) => state.selectedLeagueUid,
  );
  const navigateFixtureDate = useMatchPickerStore(
    (state) => state.navigateFixtureDate,
  );

  return (
    <aside
      className={`footballay-content-panel footballay-content-panel--${view.toLowerCase()}${collapsed ? ' footballay-content-panel--collapsed' : ''}`}
      data-footballay-content-app=""
      aria-label="Footballay"
    >
      {collapsed ? (
        <button
          className="footballay-match-select-expand-button"
          type="button"
          aria-label={t(locale, 'openMatchSelector')}
          onClick={() => setCollapsed(false)}
        >
          <CalendarDays />
        </button>
      ) : (
        <>
          <div className="footballay-match-select-topbar">
            <button
              className="footballay-close-button"
              type="button"
              aria-label={t(locale, 'close')}
              onClick={() => setCollapsed(true)}
            >
              <X />
            </button>
            <div className="footballay-topbar-tabs">
              <button
                className={`footballay-topbar-tab${view === 'League' ? ' footballay-topbar-tab--selected' : ''}`}
                type="button"
                onClick={() => setView('League')}
              >
                {t(locale, 'league')}
              </button>
              <button
                className={`footballay-topbar-tab${view === 'Match' ? ' footballay-topbar-tab--selected' : view === 'DatePicker' ? ' footballay-topbar-tab--active-text' : ''}`}
                type="button"
                onClick={() => setView('Match')}
              >
                {t(locale, 'match')}
              </button>
            </div>
            <div
              className={`footballay-date-control${view === 'DatePicker' ? ' footballay-date-control--selected' : ''}`}
            >
              <button
                type="button"
                aria-label={t(locale, 'previousFixtureDate')}
                disabled={!selectedLeagueUid}
                onClick={() => {
                  setView('Match');
                  void navigateFixtureDate('previous');
                }}
              >
                <span className="footballay-caret footballay-caret--left" />
              </button>
              <button
                type="button"
                aria-label={t(locale, 'fixtureDatePicker')}
                aria-haspopup="dialog"
                aria-expanded={view === 'DatePicker'}
                disabled={!selectedLeagueUid}
                onClick={() =>
                  setView(view === 'DatePicker' ? 'Match' : 'DatePicker')
                }
              >
                {selectedDate?.slice(5).replace('-', '.') ?? '08.22'}
              </button>
              <button
                type="button"
                aria-label={t(locale, 'nextFixtureDate')}
                disabled={!selectedLeagueUid}
                onClick={() => {
                  setView('Match');
                  void navigateFixtureDate('next');
                }}
              >
                <span className="footballay-caret footballay-caret--right" />
              </button>
            </div>
          </div>
          <div className="footballay-match-select-content">
            {view === 'League' ? (
              <LeaguePicker onSelect={() => setView('Match')} />
            ) : (
              <FixturePicker
                view={view}
                onDateSelect={() => setView('Match')}
              />
            )}
          </div>
        </>
      )}
    </aside>
  );
}
