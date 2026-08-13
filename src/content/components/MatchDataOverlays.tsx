import { useState } from 'react';
import { useMatchPickerStore } from '@/content/stores/matchPickerStore';
import { useMatchDataStore } from '@/content/stores/matchDataStore';
import type {
  FixtureEventsDto,
  FixtureLineupDto,
  FixtureStatisticsDto,
  FixtureStatusDto,
} from '@/shared/footballayApiProtocol';

type DetailTab = 'lineup' | 'events' | 'statistics';

export function MatchDataOverlays() {
  const fixtureUid = useMatchPickerStore((state) => state.selectedFixtureUid);
  const fixture = useMatchPickerStore((state) =>
    state.fixtures.find((item) => item.uid === fixtureUid),
  );
  const statusData = useMatchDataStore((state) => state.statusData);
  const lineup = useMatchDataStore((state) => state.lineup);
  const events = useMatchDataStore((state) => state.events);
  const statistics = useMatchDataStore((state) => state.statistics);
  const status = useMatchDataStore((state) => state.status);
  const error = useMatchDataStore((state) => state.error);
  if (!fixtureUid) return null;

  return (
    <>
      <MatchSummary fixture={fixture} statusData={statusData} status={status} />
      <MatchDetails
        lineup={lineup}
        events={events}
        statistics={statistics}
        status={status}
        error={error}
      />
    </>
  );
}

function MatchSummary({
  fixture,
  statusData,
  status,
}: {
  fixture?: {
    homeTeam?: { name: string; nameKo?: string | null } | null;
    awayTeam?: { name: string; nameKo?: string | null } | null;
  };
  statusData?: FixtureStatusDto;
  status: string;
}) {
  const liveStatus = statusData?.liveStatus;
  return (
    <aside className="footballay-match-summary" aria-label="Match summary">
      {status === 'loading' && '경기 데이터를 불러오는 중입니다.'}
      {fixture && liveStatus && (
        <>
          <span>
            {fixture.homeTeam?.nameKo ?? fixture.homeTeam?.name ?? 'Home'}
          </span>
          <strong>
            {liveStatus.score.home ?? 0} : {liveStatus.score.away ?? 0}
          </strong>
          <span>
            {fixture.awayTeam?.nameKo ?? fixture.awayTeam?.name ?? 'Away'}
          </span>
          <em>
            {liveStatus.elapsed
              ? `${liveStatus.elapsed}'`
              : liveStatus.shortStatus}
          </em>
        </>
      )}
    </aside>
  );
}

function MatchDetails({
  lineup,
  events,
  statistics,
  error,
  status,
}: {
  lineup?: FixtureLineupDto;
  events?: FixtureEventsDto;
  statistics?: FixtureStatisticsDto;
  error?: string;
  status: string;
}) {
  const [tab, setTab] = useState<DetailTab>('lineup');
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
      {status === 'loading' && <p>경기 데이터를 불러오는 중입니다.</p>}
      {status === 'error' && (
        <p role="alert">경기 데이터를 불러오지 못했습니다: {error}</p>
      )}
      {tab === 'lineup' && <Lineup lineup={lineup} />}
      {tab === 'events' && <Events events={events} />}
      {tab === 'statistics' && <Statistics statistics={statistics} />}
    </aside>
  );
}

function Lineup({ lineup }: { lineup?: FixtureLineupDto }) {
  const teams = [lineup?.lineup.home, lineup?.lineup.away].filter(Boolean);
  return (
    <div>
      {teams.length ? (
        teams.map(
          (team) =>
            team && (
              <section key={team.teamName}>
                <strong>
                  {team.teamKoreanName ?? team.teamName} {team.formation ?? ''}
                </strong>
                <p>
                  {[...team.players, ...team.substitutes]
                    .map((player) => player.koreanName ?? player.name)
                    .join(', ') || '선수 정보가 없습니다.'}
                </p>
              </section>
            ),
        )
      ) : (
        <p>라인업이 없습니다.</p>
      )}
    </div>
  );
}

function Events({ events }: { events?: FixtureEventsDto }) {
  return (
    <ol>
      {events?.events.length ? (
        events.events.map((event) => (
          <li key={event.sequence}>
            {event.elapsed}' ·{' '}
            {event.player?.koreanName ??
              event.player?.name ??
              event.team.koreanName ??
              event.team.name}{' '}
            · {event.detail || event.type}
          </li>
        ))
      ) : (
        <li>이벤트가 없습니다.</li>
      )}
    </ol>
  );
}

function Statistics({ statistics }: { statistics?: FixtureStatisticsDto }) {
  const rows = [
    [
      '점유율',
      statistics?.home?.teamStatistics.ballPossession,
      statistics?.away?.teamStatistics.ballPossession,
      '%',
    ],
    [
      'xG',
      statistics?.home?.teamStatistics.xg.at(-1)?.xg,
      statistics?.away?.teamStatistics.xg.at(-1)?.xg,
      '',
    ],
    [
      '슈팅',
      statistics?.home?.teamStatistics.totalShots,
      statistics?.away?.teamStatistics.totalShots,
      '',
    ],
    [
      '유효 슈팅',
      statistics?.home?.teamStatistics.shotsOnGoal,
      statistics?.away?.teamStatistics.shotsOnGoal,
      '',
    ],
    [
      '코너',
      statistics?.home?.teamStatistics.cornerKicks,
      statistics?.away?.teamStatistics.cornerKicks,
      '',
    ],
    [
      '파울',
      statistics?.home?.teamStatistics.fouls,
      statistics?.away?.teamStatistics.fouls,
      '',
    ],
  ];
  return (
    <dl>
      {rows.map(([label, home, away, suffix]) => (
        <div key={String(label)}>
          <dt>{label}</dt>
          <dd>
            {home ?? '-'}
            {suffix} : {away ?? '-'}
            {suffix}
          </dd>
        </div>
      ))}
    </dl>
  );
}
