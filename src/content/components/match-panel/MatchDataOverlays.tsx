import { BarChart3, Flag, UsersRound, X } from 'lucide-react';
import { useState } from 'react';
import { useMatchPickerStore } from '@/content/stores/matchPickerStore';
import { useMatchDataStore } from '@/content/stores/matchDataStore';
import { LineupTab } from './LineupTab';
import { StatisticsTab } from './StatisticsTab';
import { EventsTab } from './EventsTab';
import './match-data-overlays.css';

type DetailTab = 'lineup' | 'statistics' | 'events';

export function MatchDataOverlays() {
  const fixtureUid = useMatchPickerStore((state) => state.selectedFixtureUid);
  const lineup = useMatchDataStore((state) => state.lineup.data);
  const [tab, setTab] = useState<DetailTab>('lineup');
  const [collapsed, setCollapsed] = useState(false);

  if (!fixtureUid) return null;
  if (collapsed) {
    return (
      <aside
        className="footballay-match-panel footballay-match-panel--collapsed"
        aria-label="Match panel"
      >
        <button
          className="footballay-match-panel__expand-button"
          type="button"
          aria-label="Open match panel"
          onClick={() => setCollapsed(false)}
        >
          <UsersRound />
        </button>
      </aside>
    );
  }

  return (
    <aside className="footballay-match-panel" aria-label="Match panel">
      <div className="footballay-match-panel__sidebar">
        <div
          className="footballay-match-panel__tabs"
          role="tablist"
          aria-label="Match panel tabs"
        >
          <button
            type="button"
            role="tab"
            aria-label="Lineup"
            aria-selected={tab === 'lineup'}
            onClick={() => setTab('lineup')}
          >
            <UsersRound />
          </button>
          <button
            type="button"
            role="tab"
            aria-label="Statistics"
            aria-selected={tab === 'statistics'}
            onClick={() => setTab('statistics')}
          >
            <BarChart3 />
          </button>
          <button
            type="button"
            role="tab"
            aria-label="Events"
            aria-selected={tab === 'events'}
            onClick={() => setTab('events')}
          >
            <Flag />
          </button>
        </div>
        <button
          className="footballay-close-button"
          type="button"
          aria-label="Minimize match panel"
          onClick={() => setCollapsed(true)}
        >
          <X />
        </button>
      </div>
      <section className="footballay-match-panel__content">
        {tab === 'lineup' ? (
          <LineupTab lineup={lineup} />
        ) : tab === 'statistics' ? (
          <StatisticsTab />
        ) : (
          <EventsTab />
        )}
      </section>
    </aside>
  );
}
