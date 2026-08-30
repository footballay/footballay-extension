import { CalendarDays, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useFixtureSelection } from '@/content/features/fixture-selection';
import { t, useContentLocale } from '@/shared/i18n/content';
import { FixturePicker } from './FixturePicker';
import { LeaguePicker } from './LeaguePicker';
import './match-select.css';

type MatchSelectView = 'League' | 'Match' | 'DatePicker';

const MATCH_SELECT_AUTO_COLLAPSE_DELAY_MS = 1_500;

export function MatchSelect() {
  const locale = useContentLocale();
  const [view, setView] = useState<MatchSelectView>('League');
  const [collapsed, setCollapsed] = useState(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const containerRef = useRef<HTMLElement | null>(null);
  const pointerInside = useRef(false);
  const hadSelectedFixture = useRef(false);
  const { selectedDate, selectedFixtureUid, selectedLeagueUid, navigateDate } =
    useFixtureSelection();

  const clearCollapseTimer = () => {
    if (collapseTimer.current === undefined) return;
    clearTimeout(collapseTimer.current);
    collapseTimer.current = undefined;
  };

  const scheduleCollapse = () => {
    clearCollapseTimer();
    collapseTimer.current = setTimeout(() => {
      collapseTimer.current = undefined;
      if (pointerInside.current || containerRef.current?.matches(':hover')) {
        return;
      }
      setCollapsed(true);
    }, MATCH_SELECT_AUTO_COLLAPSE_DELAY_MS);
  };

  useEffect(() => () => clearCollapseTimer(), []);

  useEffect(() => {
    if (!selectedFixtureUid) {
      clearCollapseTimer();
      if (hadSelectedFixture.current) setCollapsed(false);
      hadSelectedFixture.current = false;
      return;
    }

    hadSelectedFixture.current = true;
    if (collapsed) return;
    pointerInside.current = containerRef.current?.matches(':hover') ?? false;
    if (!pointerInside.current) scheduleCollapse();
  }, [collapsed, selectedFixtureUid]);

  return (
    <aside
      className={`footballay-content-panel footballay-content-panel--${view.toLowerCase()}${collapsed ? ' footballay-content-panel--collapsed' : ''}`}
      data-footballay-content-app=""
      aria-label="Footballay"
      ref={containerRef}
      onPointerEnter={() => {
        pointerInside.current = true;
        clearCollapseTimer();
      }}
      onPointerLeave={() => {
        pointerInside.current = false;
        if (selectedFixtureUid && !collapsed) scheduleCollapse();
      }}
    >
      {collapsed ? (
        <button
          className="footballay-match-select-expand-button"
          type="button"
          aria-label={t(locale, 'openMatchSelector')}
          onClick={() => {
            clearCollapseTimer();
            setCollapsed(false);
          }}
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
              onClick={() => {
                clearCollapseTimer();
                setCollapsed(true);
              }}
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
                  void navigateDate('previous');
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
                  void navigateDate('next');
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
