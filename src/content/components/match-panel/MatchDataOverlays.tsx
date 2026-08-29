import { BarChart3, Flag, Settings, UsersRound, X } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useMatchPanel } from '@/content/features/match-data';
import { useSettings } from '@/content/features/settings';
import { t, useContentLocale } from '@/shared/i18n/content';
import { LineupTab } from './lineup/LineupTab';
import { StatisticsTab } from './statistics/StatisticsTab';
import { EventsTab } from './events/EventsTab';
import { SettingsTab } from './settings/SettingsTab';
import './match-data-overlays.css';

type DetailTab = 'lineup' | 'statistics' | 'events' | 'settings';

const MATCH_PANEL_CHROME_HIDE_DELAY_MS = 2_500;

export function MatchDataOverlays() {
  const locale = useContentLocale();
  const { settings } = useSettings();
  const { fixtureInfo } = useMatchPanel();
  const [tab, setTab] = useState<DetailTab>('lineup');
  const [collapsed, setCollapsed] = useState(false);
  const [chromeHidden, setChromeHidden] = useState(false);
  const hideChromeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const panelRef = useRef<HTMLElement | null>(null);
  const pointerInsidePanel = useRef(false);

  const clearChromeHideTimer = () => {
    if (hideChromeTimer.current === undefined) return;
    clearTimeout(hideChromeTimer.current);
    hideChromeTimer.current = undefined;
  };

  const showChrome = () => {
    pointerInsidePanel.current = true;
    clearChromeHideTimer();
    setChromeHidden(false);
  };

  const scheduleChromeHide = () => {
    clearChromeHideTimer();
    hideChromeTimer.current = setTimeout(() => {
      hideChromeTimer.current = undefined;
      if (pointerInsidePanel.current || panelRef.current?.matches(':hover')) {
        return;
      }
      setChromeHidden(true);
    }, MATCH_PANEL_CHROME_HIDE_DELAY_MS);
  };

  useEffect(() => () => clearChromeHideTimer(), []);

  useEffect(() => {
    if (!fixtureInfo || collapsed) {
      pointerInsidePanel.current = false;
      clearChromeHideTimer();
      setChromeHidden(false);
      return;
    }

    pointerInsidePanel.current = panelRef.current?.matches(':hover') ?? false;
    setChromeHidden(false);
    if (!pointerInsidePanel.current) scheduleChromeHide();
  }, [collapsed, fixtureInfo?.uid]);

  if (!fixtureInfo) return null;
  if (collapsed) {
    return (
      <aside
        className="footballay-match-panel footballay-match-panel--collapsed"
        aria-label={t(locale, 'matchPanel')}
      >
        <button
          className="footballay-match-panel__expand-button"
          type="button"
          aria-label={t(locale, 'openMatchPanel')}
          onClick={() => {
            clearChromeHideTimer();
            setChromeHidden(false);
            setCollapsed(false);
          }}
        >
          <UsersRound />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className={`footballay-match-panel${tab === 'settings' ? '' : ' footballay-match-panel--data'}${chromeHidden ? ' footballay-match-panel--chrome-hidden' : ''}`}
      aria-label={t(locale, 'matchPanel')}
      ref={panelRef}
      onPointerEnter={showChrome}
      onPointerLeave={() => {
        pointerInsidePanel.current = false;
        scheduleChromeHide();
      }}
      style={
        {
          '--footballay-panel-opacity': `${settings.panelOpacity}%`,
          '--footballay-lineup-player-card-opacity': `${settings.lineupPlayerCardOpacity}%`,
        } as CSSProperties
      }
    >
      <div className="footballay-match-panel__sidebar">
        <div
          className="footballay-match-panel__tabs"
          role="tablist"
          aria-label={t(locale, 'matchPanelTabs')}
        >
          <button
            type="button"
            role="tab"
            aria-label={t(locale, 'lineup')}
            aria-selected={tab === 'lineup'}
            onClick={() => setTab('lineup')}
          >
            <UsersRound />
          </button>
          <button
            type="button"
            role="tab"
            aria-label={t(locale, 'statistics')}
            aria-selected={tab === 'statistics'}
            onClick={() => setTab('statistics')}
          >
            <BarChart3 />
          </button>
          <button
            type="button"
            role="tab"
            aria-label={t(locale, 'events')}
            aria-selected={tab === 'events'}
            onClick={() => setTab('events')}
          >
            <Flag />
          </button>
        </div>
        <div className="footballay-match-panel__actions">
          <button
            type="button"
            aria-label={t(locale, 'settings')}
            aria-pressed={tab === 'settings'}
            onClick={() => setTab('settings')}
          >
            <Settings />
          </button>
          <button
            className="footballay-close-button"
            type="button"
            aria-label={t(locale, 'minimizeMatchPanel')}
            onClick={() => {
              showChrome();
              setCollapsed(true);
            }}
          >
            <X />
          </button>
        </div>
      </div>
      <section className="footballay-match-panel__content">
        {tab === 'lineup' ? (
          <LineupTab />
        ) : tab === 'statistics' ? (
          <StatisticsTab />
        ) : tab === 'events' ? (
          <EventsTab />
        ) : (
          <SettingsTab />
        )}
      </section>
    </aside>
  );
}
