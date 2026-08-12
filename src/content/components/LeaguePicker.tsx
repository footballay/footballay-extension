import { useMatchPickerStore } from '@/content/stores/matchPickerStore';

export function LeaguePicker() {
    const leagues = useMatchPickerStore((state) => state.leagues);
    const leagueStatus = useMatchPickerStore((state) => state.leagueStatus);
    const leagueError = useMatchPickerStore((state) => state.leagueError);
    const selectedLeagueUid = useMatchPickerStore((state) => state.selectedLeagueUid);
    const loadAvailableLeagues = useMatchPickerStore((state) => state.loadAvailableLeagues);
    const selectLeagueAndLoadFixtures = useMatchPickerStore((state) => state.selectLeagueAndLoadFixtures);

    return (
        <>
            {leagueStatus === 'loading' && <p className="footballay-content-status" role="status">리그를 불러오는 중입니다.</p>}
            {leagueStatus === 'error' && (
                <div className="footballay-content-status" role="alert">
                    <p>리그를 불러오지 못했습니다: {leagueError}</p>
                    <button type="button" onClick={() => void loadAvailableLeagues()}>다시 시도</button>
                </div>
            )}
            {leagueStatus === 'ready' && leagues.length === 0 && <p className="footballay-content-status">사용 가능한 리그가 없습니다.</p>}
            {leagues.length > 0 && (
                <div className="footballay-league-list" role="listbox" aria-label="Available leagues">
                    {leagues.map((league) => (
                        <button
                            key={league.uid}
                            className={`footballay-league-button${league.uid === selectedLeagueUid ? ' footballay-league-button--selected' : ''}`}
                            type="button"
                            aria-pressed={league.uid === selectedLeagueUid}
                            onClick={() => void selectLeagueAndLoadFixtures(league.uid)}
                        >
                            {league.nameKo ?? league.name}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}
