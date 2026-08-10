import { useEffect } from 'react';
import { useLeagueStore } from '@/content/stores/leagueStore';
import './content-app.css';

export function ContentApp() {
    const leagues = useLeagueStore((state) => state.leagues);
    const status = useLeagueStore((state) => state.status);
    const error = useLeagueStore((state) => state.error);
    const selectedLeagueUid = useLeagueStore((state) => state.selectedLeagueUid);
    const loadAvailableLeagues = useLeagueStore((state) => state.loadAvailableLeagues);
    const selectLeague = useLeagueStore((state) => state.selectLeague);

    useEffect(() => {
        void loadAvailableLeagues();
    }, [loadAvailableLeagues]);

    return (
        <aside className="footballay-content-panel" data-footballay-content-app="" aria-label="Footballay">
            <strong className="footballay-content-title">Footballay</strong>
            {status === 'loading' && (
                <p className="footballay-content-status" role="status">
                    리그를 불러오는 중입니다.
                </p>
            )}
            {status === 'error' && (
                <div className="footballay-content-status" role="alert">
                    <p>리그를 불러오지 못했습니다: {error}</p>
                    <button type="button" onClick={() => void loadAvailableLeagues()}>
                        다시 시도
                    </button>
                </div>
            )}
            {status === 'ready' && leagues.length === 0 && (
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
                                onClick={() => selectLeague(league.uid)}
                            >
                                {league.nameKo ?? league.name}
                            </button>
                        );
                    })}
                </div>
            )}
        </aside>
    );
}
