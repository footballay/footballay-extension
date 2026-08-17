import { useState } from 'react';
import { useMatchPickerStore } from '@/content/stores/matchPickerStore';
import { useMatchDataStore } from '@/content/stores/matchDataStore';

type DetailTab = 'lineup' | 'events' | 'statistics';

export function MatchDataOverlays() {
  const fixtureUid = useMatchPickerStore((state) => state.selectedFixtureUid);
  const lineup = useMatchDataStore((state) => state.lineup);
  const events = useMatchDataStore((state) => state.events);
  const statistics = useMatchDataStore((state) => state.statistics);
  const [tab, setTab] = useState<DetailTab>('lineup');

  if (!fixtureUid) return null;

  const data = { lineup, events, statistics }[tab];
  return (
    <aside className="footballay-match-details" aria-label="Match data">
      <div
        className="footballay-match-details__tabs"
        role="tablist"
        aria-label="Match data tabs"
      >
        {(['lineup', 'events', 'statistics'] as const).map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </div>
      {/* 임시 구현: 데이터 구조가 정리되기 전까지 원본 응답을 그대로 표시합니다. */}
      <pre>{data ? JSON.stringify(data, null, 2) : '데이터가 없습니다.'}</pre>
    </aside>
  );
}
