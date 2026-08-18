import { useEffect, useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { FixturePicker } from '@/content/components/FixturePicker';
import { LeaguePicker } from '@/content/components/LeaguePicker';
import { MatchDataOverlays } from '@/content/components/MatchDataOverlays';
import { useMatchPickerStore } from '@/content/stores/matchPickerStore';
import '@/styles/fonts.css';
import './content-app.css';

export function ContentApp() {
  const [view, setView] = useState<'League' | 'Match' | 'DatePicker'>('League');
  const [collapsed, setCollapsed] = useState(false);
  const loadAvailableLeagues = useMatchPickerStore(
    (state) => state.loadAvailableLeagues,
  );
  const selectedDate = useMatchPickerStore((state) => state.selectedDate);
  const selectedLeagueUid = useMatchPickerStore(
    (state) => state.selectedLeagueUid,
  );
  const navigateFixtureDate = useMatchPickerStore(
    (state) => state.navigateFixtureDate,
  );

  useEffect(() => {
    void loadAvailableLeagues();
  }, [loadAvailableLeagues]);

  return (
    <>
      <aside
        className={`footballay-content-panel footballay-content-panel--${view.toLowerCase()}${collapsed ? ' footballay-content-panel--collapsed' : ''}`}
        data-footballay-content-app=""
        aria-label="Footballay"
      >
        {collapsed ? (
          <button
            className="footballay-match-select-expand-button"
            type="button"
            aria-label="Open match selector"
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
                aria-label="Close"
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
                  League
                </button>
                <button
                  className={`footballay-topbar-tab${view === 'Match' ? ' footballay-topbar-tab--selected' : ''}`}
                  type="button"
                  onClick={() => setView('Match')}
                >
                  Match
                </button>
              </div>
              <div
                className={`footballay-date-control${view === 'DatePicker' ? ' footballay-date-control--selected' : ''}`}
              >
                <button
                  type="button"
                  aria-label="Previous fixture date"
                  disabled={!selectedLeagueUid}
                  onClick={() => void navigateFixtureDate('previous')}
                >
                  <span className="footballay-caret footballay-caret--left" />
                </button>
                <button
                  type="button"
                  aria-label="Fixture date picker"
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
                  aria-label="Next fixture date"
                  disabled={!selectedLeagueUid}
                  onClick={() => void navigateFixtureDate('next')}
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
      <MatchDataOverlays />
    </>
  );
}
