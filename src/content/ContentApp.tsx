import { useEffect } from 'react';
import { useMatchPickerStore } from '@/content/stores/matchPickerStore';
import './content-app.css';

export function ContentApp() {
    const leagues = useMatchPickerStore((state) => state.leagues);
    const leagueStatus = useMatchPickerStore((state) => state.leagueStatus);
    const leagueError = useMatchPickerStore((state) => state.leagueError);
    const fixtures = useMatchPickerStore((state) => state.fixtures);
    const fixtureStatus = useMatchPickerStore((state) => state.fixtureStatus);
    const fixtureError = useMatchPickerStore((state) => state.fixtureError);
    const selectedLeagueUid = useMatchPickerStore((state) => state.selectedLeagueUid);
    const selectedFixtureUid = useMatchPickerStore((state) => state.selectedFixtureUid);
    const loadAvailableLeagues = useMatchPickerStore((state) => state.loadAvailableLeagues);
    const selectLeagueAndLoadFixtures = useMatchPickerStore((state) => state.selectLeagueAndLoadFixtures);
    const selectFixture = useMatchPickerStore((state) => state.selectFixture);

    useEffect(() => {
        void loadAvailableLeagues();
    }, [loadAvailableLeagues]);

    return (
        <aside className="footballay-content-panel" data-footballay-content-app="" aria-label="Footballay">
            <strong className="footballay-content-title">Footballay</strong>
            {leagueStatus === 'loading' && (
                <p className="footballay-content-status" role="status">
                    리그를 불러오는 중입니다.
                </p>
            )}
            {leagueStatus === 'error' && (
                <div className="footballay-content-status" role="alert">
                    <p>리그를 불러오지 못했습니다: {leagueError}</p>
                    <button type="button" onClick={() => void loadAvailableLeagues()}>
                        다시 시도
                    </button>
                </div>
            )}
            {leagueStatus === 'ready' && leagues.length === 0 && (
                <p className="footballay-content-status">사용 가능한 리그가 없습니다.</p>
            )}
            {leagues.length > 0 && (
                <div className="footballay-league-list" role="listbox" aria-label="Available leagues">
                    {leagues.map((league) => {
                        const selected = league.uid === selectedLeagueUid;
                        return (
                            <button
                                key={league.uid}
                                className={`footballay-league-button${selected ? ' footballay-league-button--selected' : ''}`}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => void selectLeagueAndLoadFixtures(league.uid)}
                            >
                                {league.nameKo ?? league.name}
                            </button>
                        );
                    })}
                </div>
            )}
            {selectedLeagueUid && (
                <section className="footballay-fixture-section" aria-label="Fixtures">
                    <strong className="footballay-fixture-title">경기</strong>
                    {fixtureStatus === 'loading' && (
                        <p className="footballay-content-status" role="status">
                            경기를 불러오는 중입니다.
                        </p>
                    )}
                    {fixtureStatus === 'error' && (
                        <p className="footballay-content-status" role="alert">
                            경기를 불러오지 못했습니다: {fixtureError}
                        </p>
                    )}
                    {fixtureStatus === 'ready' && fixtures.length === 0 && (
                        <p className="footballay-content-status">표시할 경기가 없습니다.</p>
                    )}
                    {fixtures.length > 0 && (
                        <div className="footballay-fixture-list" role="listbox" aria-label="Fixtures">
                            {fixtures.map((fixture) => {
                                const selected = fixture.uid === selectedFixtureUid;
                                const homeTeamName = fixture.homeTeam?.nameKo ?? fixture.homeTeam?.name ?? 'TBD';
                                const awayTeamName = fixture.awayTeam?.nameKo ?? fixture.awayTeam?.name ?? 'TBD';
                                const score = `${fixture.score.home ?? '-'} : ${fixture.score.away ?? '-'}`;
                                const kickoff = fixture.kickoff
                                    ? new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(fixture.kickoff))
                                    : '--:--';

                                return (
                                    <button
                                        key={fixture.uid}
                                        className={`footballay-fixture-button${selected ? ' footballay-fixture-button--selected' : ''}`}
                                        type="button"
                                        aria-pressed={selected}
                                        onClick={() => selectFixture(fixture.uid)}
                                    >
                                        <span>{kickoff} · {fixture.status.shortStatus}</span>
                                        <strong>{homeTeamName} {score} {awayTeamName}</strong>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}
        </aside>
    );
}
