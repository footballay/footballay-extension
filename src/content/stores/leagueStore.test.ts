import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestAvailableLeagues = vi.hoisted(() => vi.fn());
vi.mock('@/shared/footballayApiProtocol', () => ({ requestAvailableLeagues }));

import { useLeagueStore } from './leagueStore';

describe('league store', () => {
    beforeEach(() => {
        requestAvailableLeagues.mockReset();
        useLeagueStore.setState({
            leagues: [],
            status: 'idle',
            error: undefined,
            selectedLeagueUid: undefined,
        });
    });

    it('loads raw league data and keeps selection in memory', async () => {
        requestAvailableLeagues.mockResolvedValueOnce({
            ok: true,
            data: [{ uid: 'league-1', name: 'Premier League', nameKo: '프리미어리그', logo: 'logo.png' }],
        });

        await useLeagueStore.getState().loadAvailableLeagues();
        useLeagueStore.getState().selectLeague('league-1');

        expect(useLeagueStore.getState()).toMatchObject({
            leagues: [{ uid: 'league-1', name: 'Premier League', nameKo: '프리미어리그', logo: 'logo.png' }],
            status: 'ready',
            selectedLeagueUid: 'league-1',
        });
    });

    it('makes an API failure available to the view', async () => {
        requestAvailableLeagues.mockResolvedValueOnce({ ok: false, error: 'Network unavailable' });

        await useLeagueStore.getState().loadAvailableLeagues();
        expect(useLeagueStore.getState()).toMatchObject({ status: 'error', error: 'Network unavailable' });
    });
});
