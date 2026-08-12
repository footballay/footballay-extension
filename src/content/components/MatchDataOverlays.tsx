import { useEffect, useState } from 'react';
import { useMatchPickerStore } from '@/content/stores/matchPickerStore';
import {
  useMatchDataStore,
  type MatchData,
} from '@/content/stores/matchDataStore';

type DetailTab = 'lineup' | 'events' | 'statistics';

export function MatchDataOverlays() {
  const fixtureUid = useMatchPickerStore((state) => state.selectedFixtureUid);
  const loadMatchData = useMatchDataStore((state) => state.loadMatchData);
  const clearMatchData = useMatchDataStore((state) => state.clearMatchData);
  const data = useMatchDataStore((state) => state.data);
  const status = useMatchDataStore((state) => state.status);
  const error = useMatchDataStore((state) => state.error);

  useEffect(() => {
    if (fixtureUid) void loadMatchData(fixtureUid);
    else clearMatchData();
  }, [clearMatchData, fixtureUid, loadMatchData]);

  if (!fixtureUid) return null;

  return (
    <>
      <MatchSummary data={data} status={status} />
      <MatchDetails data={data} status={status} error={error} />
    </>
  );
}

function MatchSummary({ data, status }: { data?: MatchData; status: string }) {
  return (
    <aside className="footballay-match-summary" aria-label="Match summary">
      {status === 'loading' && '경기 데이터를 불러오는 중입니다.'}
      {data && (
        <>
          <span>{data.homeTeamName}</span>
          <strong>
            {data.homeScore} : {data.awayScore}
          </strong>
          <span>{data.awayTeamName}</span>
          <em>{data.elapsed ? `${data.elapsed}'` : data.status}</em>
        </>
      )}
    </aside>
  );
}

function MatchDetails({
  data,
  error,
  status,
}: {
  data?: MatchData;
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
      {data && tab === 'lineup' && <Lineup data={data} />}
      {data && tab === 'events' && <Events data={data} />}
      {data && tab === 'statistics' && <Statistics data={data} />}
    </aside>
  );
}

function Lineup({ data }: { data: MatchData }) {
  const teams = [data.lineup.home, data.lineup.away].filter(Boolean);
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

function Events({ data }: { data: MatchData }) {
  return (
    <ol>
      {data.events.length ? (
        data.events.map((event) => (
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

function Statistics({ data }: { data: MatchData }) {
  const rows = [
    [
      '점유율',
      data.statistics.home?.teamStatistics.ballPossession,
      data.statistics.away?.teamStatistics.ballPossession,
      '%',
    ],
    [
      'xG',
      data.statistics.home?.teamStatistics.xg.at(-1)?.xg,
      data.statistics.away?.teamStatistics.xg.at(-1)?.xg,
      '',
    ],
    [
      '슈팅',
      data.statistics.home?.teamStatistics.totalShots,
      data.statistics.away?.teamStatistics.totalShots,
      '',
    ],
    [
      '유효 슈팅',
      data.statistics.home?.teamStatistics.shotsOnGoal,
      data.statistics.away?.teamStatistics.shotsOnGoal,
      '',
    ],
    [
      '코너',
      data.statistics.home?.teamStatistics.cornerKicks,
      data.statistics.away?.teamStatistics.cornerKicks,
      '',
    ],
    [
      '파울',
      data.statistics.home?.teamStatistics.fouls,
      data.statistics.away?.teamStatistics.fouls,
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
