import { BarChart3, Flag, Settings, UsersRound, X } from 'lucide-react';
import { useState } from 'react';
import { useMatchPanel } from '@/content/match-data';
import { t, useContentLocale } from '@/shared/i18n/content';
import { LineupTab } from './LineupTab';
import { StatisticsTab } from './StatisticsTab';
import { EventsTab } from './EventsTab';
import { SettingsTab } from './SettingsTab';
import './match-data-overlays.css';

type DetailTab = 'lineup' | 'statistics' | 'events' | 'settings';

export function MatchDataOverlays() {
  const locale = useContentLocale();
  const { fixtureInfo } = useMatchPanel();
  const [tab, setTab] = useState<DetailTab>('lineup');
  const [collapsed, setCollapsed] = useState(false);

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
          onClick={() => setCollapsed(false)}
        >
          <UsersRound />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="footballay-match-panel"
      aria-label={t(locale, 'matchPanel')}
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
            onClick={() => setCollapsed(true)}
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
